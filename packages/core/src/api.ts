/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import {
  AnyInputDef,
  AnyOperationDef,
  AnyOutputDef,
  BinaryOutputDef,
  BodyBinaryParamDef,
  BodyTextParamDef,
  ControllerDef,
  ControllerOperations,
  InferControllerClientType,
  InferControllerImplType,
  JsonOutputDef,
  OperationDef,
  OperationMethod,
  StringOutputDef,
  ZodOutputDef,
  ZodParamDef
} from './types.js';
import { ValidationError, validate } from './validation.js';

const inputDefFactory = {
  bodyBinary(mimeType = 'application/octet-stream') {
    return new BodyBinaryParamDef(mimeType);
  },
  bodyText(mimeType = 'text/plain') {
    return new BodyTextParamDef(mimeType);
  },
  body<T extends z.ZodTypeAny>(schema: T) {
    return new ZodParamDef('body', schema);
  },
  cookie<T extends z.ZodTypeAny>(schema: T, name?: string) {
    return new ZodParamDef('cookie', schema, name);
  },
  header<T extends z.ZodTypeAny>(schema: T, name: string) {
    return new ZodParamDef('header', schema, name);
  },
  query<T extends z.ZodTypeAny>(schema: T, name?: string) {
    return new ZodParamDef('query', schema, name);
  },
  path<T extends z.ZodTypeAny>(schema: T, name?: string) {
    return new ZodParamDef('path', schema, name);
  }
};

const outputDefFactory = {
  binary(mimeType?: string): BinaryOutputDef {
    return new BinaryOutputDef(mimeType);
  },
  boolean(mimeType?: string): JsonOutputDef<boolean> {
    return new JsonOutputDef(mimeType);
  },
  number(mimeType?: string): JsonOutputDef<number> {
    return new JsonOutputDef(mimeType);
  },
  object(mimeType?: string): JsonOutputDef<object> {
    return new JsonOutputDef(mimeType);
  },
  schema<T extends z.ZodTypeAny>(schema: T, mimeType?: string): ZodOutputDef<T> {
    return new ZodOutputDef(schema, mimeType);
  },
  text(mimeType?: string): StringOutputDef {
    return new StringOutputDef(mimeType);
  }
};

class OperationDefBuilder<TInputDef, TOutputDef> {
  static init(path: string, method: OperationMethod) {
    const inputDef = {};
    return new OperationDefBuilder<typeof inputDef, undefined>({
      path,
      method,
      inputDef
    });
  }
  private constructor(public def: OperationDef<TInputDef, TOutputDef>) {}

  input<TNewInputDef extends AnyInputDef>(inputDef: TNewInputDef) {
    return new OperationDefBuilder<TNewInputDef, TOutputDef>({ ...this.def, inputDef });
  }

  output<TNewOutputDef extends AnyOutputDef>(outputDef: TNewOutputDef) {
    return new OperationDefBuilder<TInputDef, TNewOutputDef>({ ...this.def, outputDef });
  }

  build() {
    return this.def;
  }
}

const operationDefFactory = {
  del(path = '') {
    return OperationDefBuilder.init(path, 'delete');
  },
  get(path = '') {
    return OperationDefBuilder.init(path, 'get');
  },
  patch(path = '') {
    return OperationDefBuilder.init(path, 'patch');
  },
  post(path = '') {
    return OperationDefBuilder.init(path, 'post');
  },
  put(path = '') {
    return OperationDefBuilder.init(path, 'put');
  }
};

function controller(basePath = '/') {
  return {
    define<TDef extends ControllerDef>(definition: TDef) {
      for (const opName in definition) {
        const def = definition[opName];
        const localPath = basePath.endsWith('/') && def.path.startsWith('/') ? def.path.substring(1) : def.path;
        def.path = `${basePath}${localPath}`;
      }
      const validationResult = validate(definition);
      if (!validationResult.isValid) {
        throw new ValidationError(validationResult);
      }
      return definition;
    }
  };
}

function implement<TDef, TContext = unknown>(definition: TDef, createContext?: () => Promise<TContext>) {
  return {
    as(impl: InferControllerImplType<typeof definition, TContext>) {
      const operations: ControllerOperations = {};
      for (const opName in definition) {
        operations[opName] = {
          def: definition[opName] as AnyOperationDef,
          impl: impl[opName]
        };
      }
      return {
        operations,
        createContext,
        testClient(context?: TContext) {
          // TODO testClient should probably be moved into server package to take advantage of all of the validation
          const testClient: Record<string, Function> = {};
          for (const opName in definition) {
            testClient[opName] = (input: any) => {
              return operations[opName].impl(input, context);
            };
          }
          return testClient as InferControllerClientType<typeof definition>;
        }
      };
    }
  };
}

export const a = {
  controller,
  implement,
  op: operationDefFactory,
  in: inputDefFactory,
  out: outputDefFactory
};
