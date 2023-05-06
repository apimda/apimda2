import { ZodFirstPartyTypeKind, ZodSchema } from 'zod';
import { PathMatcher } from './path-matcher';
import { AnyInputDef, AnyParamDef, ControllerDef, ZodParamDef } from './types';

export enum ViolationCode {
  DUPLICATE_METHOD_PATH,
  INVALID_PATH,
  MISSING_PATH_VAR,
  INVALID_PATH_VAR,
  MULTIPLE_BODY_VARS
}

export class Violation {
  constructor(public message: string, public code: ViolationCode) {}
}

export class ValidationError extends Error {
  constructor(public validationResult: ValidationResult) {
    super(validationResult.errorMessage);
  }
}

export class ValidationResult {
  constructor(public violations: Violation[]) {}

  get isValid(): boolean {
    return this.violations.length === 0;
  }

  get errorMessage(): string | undefined {
    if (!this.isValid) {
      const messages = this.violations.map(v => v.message);
      return messages.join('\n');
    }
  }
}

function isInvalidPath(path: string): boolean {
  return path === '' || !path.startsWith('/') || path.endsWith('/') || path.indexOf('//') !== -1;
}

interface NamedParamDef {
  paramDef: AnyParamDef;
  paramName: string;
  propertyName: string;
}

function paramsAsArray(inputDef: AnyInputDef) {
  return Object.entries(inputDef).map(([propertyName, paramDef]) => {
    const value: NamedParamDef = {
      paramDef,
      propertyName,
      paramName: paramDef.name ?? propertyName
    };
    return value;
  });
}

/**
 * Runtime validation of controller definitions.
 * It would be better if we could use the type system and make these compile-time errors, however it's a stop gap for now.
 * @param def definition to validate
 */
export function validate(controllerDef: ControllerDef) {
  const violations = new Array<Violation>();
  const methodPaths = new Set<string>();

  for (const opName in controllerDef) {
    const opDef = controllerDef[opName];
    const params = paramsAsArray(opDef.inputDef);
    const pathInfo = PathMatcher.parse(opDef.path);

    // DUPLICATE_METHOD_PATH
    const methodPath = `${opDef.method} ${pathInfo.path}`;
    if (methodPaths.has(methodPath)) {
      violations.push(
        new Violation(
          `Duplicate method/path '${methodPath}' in operation ${opName}`,
          ViolationCode.DUPLICATE_METHOD_PATH
        )
      );
    }
    methodPaths.add(methodPath);

    // INVALID_PATH
    if (isInvalidPath(pathInfo.path)) {
      violations.push(new Violation(`Invalid path '${opDef.path}' in operation ${opName}`, ViolationCode.INVALID_PATH));
    }

    // MISSING_PATH_VAR
    const pathVars = params.filter(p => p.paramDef.location === 'path');
    for (const expectedPathVar of pathInfo.pathVars) {
      if (!pathVars.find(p => p.paramName === expectedPathVar)) {
        violations.push(
          new Violation(
            `Could not find path variable '${expectedPathVar}' in operation ${opName}`,
            ViolationCode.MISSING_PATH_VAR
          )
        );
      }
    }
    pathInfo.pathVars;

    // INVALID_PATH_VAR
    for (const pathVar of pathVars) {
      const zodParam = pathVar.paramDef as ZodParamDef<ZodSchema>;
      const unwrappedType = zodParam.serializer.unwrappedTypeKind;
      if (
        unwrappedType !== ZodFirstPartyTypeKind.ZodNumber &&
        unwrappedType !== ZodFirstPartyTypeKind.ZodString &&
        unwrappedType !== ZodFirstPartyTypeKind.ZodBoolean
      ) {
        violations.push(
          new Violation(
            `Path variable '${pathVar.propertyName}' in operation ${opName} is an object type`,
            ViolationCode.INVALID_PATH_VAR
          )
        );
      }
    }

    // MULTIPLE_BODY_VARS
    const bodyVars = params.filter(p => p.paramDef.location === 'body');
    if (bodyVars.length > 1) {
      violations.push(
        new Violation(`Multiple body parameters declared in operation ${opName}`, ViolationCode.MULTIPLE_BODY_VARS)
      );
    }
  }

  return new ValidationResult(violations);
}
