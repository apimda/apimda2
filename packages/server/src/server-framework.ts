/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyOperation, AnyOutputType, AnyParamDef, BodyBinaryParamDef, BodyTextParamDef } from '@apimda/core';
import { ZodError } from 'zod';
import { ApimdaResult } from './apimda-result';
import { HttpError } from './http-error';

export type ServerParamValueType = 'string' | 'number' | 'boolean' | 'object' | 'Buffer';

export interface ServerResult {
  statusCode: number;
  headers: Record<string, string | boolean | number>;
  cookies?: Record<string, string | boolean | number>;
  body?: string | Buffer;
}

export interface RequestExtractor {
  bodyBuffer(): Buffer | undefined;
  bodyText(): string | undefined;
  cookie(name: string): string | undefined;
  header(name: string): string | undefined;
  query(name: string): string | undefined;
  path(name: string): string | undefined;
}

export class ContextHolder {
  private context: any = undefined;
  private initialized: boolean;
  constructor(private createContext?: () => Promise<any>) {
    this.initialized = createContext === undefined;
  }
  async getContext() {
    if (!this.initialized && this.createContext) {
      this.context = await this.createContext();
      this.initialized = true;
    }
    return this.context;
  }
}

class ServerParam {
  private name: string;
  constructor(public def: AnyParamDef, public propertyName: string) {
    this.name = this.def.name ?? this.propertyName;
  }
  value(extractor: RequestExtractor) {
    try {
      if (this.def instanceof BodyBinaryParamDef) {
        return extractor.bodyBuffer();
      } else if (this.def instanceof BodyTextParamDef) {
        return extractor.bodyText();
      }

      switch (this.def.location) {
        case 'body': {
          return this.def.deserialize(extractor.bodyText());
        }
        case 'cookie': {
          return this.def.deserialize(extractor.cookie(this.name));
        }
        case 'header': {
          return this.def.deserialize(extractor.header(this.name));
        }
        case 'query': {
          const raw = extractor.query(this.name);
          return raw ? this.def.deserialize(decodeURIComponent(raw)) : this.def.deserialize(raw);
        }
        case 'path': {
          const raw = extractor.path(this.name);
          if (!raw) {
            throw new Error(`Path parameter not found`);
          }
          return this.def.deserialize(decodeURIComponent(raw));
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        throw new HttpError(400, `Error parsing ${this.def.location} param '${this.name}': ${e.message}`);
      } else if (e instanceof ZodError) {
        throw new HttpError(400, `Error parsing ${this.def.location} param '${this.name}':\n${e.message}`);
      } else {
        throw new HttpError(400, `Could not parse ${this.def.location} param '${this.name}'`);
      }
    }
  }
}

export class ServerOperation {
  public readonly params: ServerParam[];

  constructor(public readonly operation: AnyOperation, public readonly contextHolder: ContextHolder) {
    this.params = Object.entries(operation.def.inputDef).map(
      ([propertyName, param]) => new ServerParam(param, propertyName)
    );
  }

  async execute(extractor: RequestExtractor) {
    try {
      const context = await this.contextHolder.getContext();
      const input = Object.fromEntries(this.params.map(p => [p.propertyName, p.value(extractor)]));
      const output = await this.operation.impl(input, context);
      return this.createSuccessResult(output);
    } catch (e) {
      if (e instanceof HttpError) {
        return this.createErrorResult(e);
      } else {
        throw e;
      }
    }
  }

  private createErrorResult(e: HttpError): ServerResult {
    return {
      statusCode: e.statusCode,
      headers: { 'content-type': 'text/plain' },
      body: e.message
    };
  }

  private defaultContentType(result: AnyOutputType) {
    if (this.operation.def.outputDef?.mimeType) {
      return this.operation.def.outputDef.mimeType;
    } else if (Buffer.isBuffer(result)) {
      return 'application/octet-stream';
    } else if (typeof result === 'string') {
      return 'text/plain';
    } else {
      return 'application/json';
    }
  }

  private resultToBody(result: AnyOutputType): undefined | string | Buffer {
    if (Buffer.isBuffer(result)) {
      return result;
    } else if (typeof result === 'number' || typeof result === 'boolean') {
      return result.toString();
    } else if (typeof result === 'object') {
      return JSON.stringify(result);
    } else if (!result) {
      return undefined;
    }
    return result;
  }

  private createSuccessResult(output: AnyOutputType | ApimdaResult<AnyOutputType>): ServerResult {
    if (ApimdaResult.isApimdaResult(output)) {
      const apimdaResult = output as ApimdaResult<AnyOutputType>;
      const headers = apimdaResult.headers;
      if (apimdaResult.result && !headers['content-type']) {
        headers['content-type'] = this.defaultContentType(apimdaResult.result);
      }
      const body = this.resultToBody(apimdaResult.result);
      return {
        statusCode: apimdaResult.statusCode,
        headers,
        cookies: apimdaResult.cookies,
        body
      };
    } else {
      const result = output as AnyOutputType;
      const body = this.resultToBody(result);
      const headers: Record<string, string> = body ? { 'content-type': this.defaultContentType(result) } : {};
      return {
        statusCode: 200,
        headers,
        body
      };
    }
  }
}
