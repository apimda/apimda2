/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodSchema, z } from 'zod';
import { ZodSerializer } from './zod-utils.js';

// -----
// Utils
// -----

export type Binary = Buffer | Blob;
export type AnySerializedType = string | Binary;

// ------
// Input
// ------

export type AnyParamType = undefined | boolean | number | object | string | Binary;
export type ParamLocation = 'body' | 'cookie' | 'header' | 'query' | 'path';

export abstract class ParamDef<TParam extends AnyParamType, TSerialized extends AnySerializedType> {
  constructor(public location: ParamLocation, public name?: string) {}
  abstract deserialize(serializedValue?: TSerialized): TParam;
}

export class ZodParamDef<TSchema extends ZodSchema> extends ParamDef<z.infer<TSchema>, string> {
  public serializer: ZodSerializer<TSchema>;
  constructor(location: ParamLocation, public schema: TSchema, name?: string) {
    super(location, name);
    this.serializer = new ZodSerializer(schema);
  }
  deserialize(serialized?: string) {
    return this.serializer.deserialize(serialized);
  }
}

export class BodyBinaryParamDef extends ParamDef<Binary, Binary> {
  constructor(public mimeType: string) {
    super('body');
  }
  deserialize(serialized: Binary) {
    return serialized;
  }
}

export class BodyTextParamDef extends ParamDef<string, string> {
  constructor(public mimeType: string) {
    super('body');
  }
  deserialize(serialized: string) {
    return serialized;
  }
}

export type AnyParamDef = ParamDef<AnyParamType, AnySerializedType>;

export type InferParamType<TParamDef, TBinary> = TParamDef extends ParamDef<infer TValue, infer TSerialized>
  ? TValue extends Binary
    ? TBinary
    : TValue
  : never;

export type AnyInputDef = Record<string, AnyParamDef>;

export type InferInputType<TInputDef, TBinary> = TInputDef extends AnyInputDef
  ? { [TKey in keyof TInputDef]: InferParamType<TInputDef[TKey], TBinary> }
  : never;

// -------
// Output
// -------

export type AnyOutputType = boolean | number | object | string | undefined | Binary;

export abstract class OutputDef<TOutput extends AnyOutputType, TSerialized extends AnySerializedType> {
  constructor(public mimeType: string) {}
  abstract deserialize(serialized: TSerialized): TOutput;
}

export class StringOutputDef extends OutputDef<string, string> {
  constructor(mimeType = 'text/plain') {
    super(mimeType);
  }
  deserialize(serialized: string): string {
    return serialized;
  }
}

export class JsonOutputDef<TOutput extends number | boolean | object> extends OutputDef<TOutput, string> {
  constructor(mimeType = 'application/json') {
    super(mimeType);
  }
  deserialize(serialized: string) {
    return JSON.parse(serialized) as TOutput;
  }
}

export class BinaryOutputDef extends OutputDef<Binary, Binary> {
  constructor(mimeType = 'application/octet-stream') {
    super(mimeType);
  }
  deserialize(serialized: Binary): Binary {
    return serialized;
  }
}

export class ZodOutputDef<TSchema extends ZodSchema> extends OutputDef<z.infer<TSchema>, string> {
  public serializer: ZodSerializer<TSchema>;
  constructor(public schema: TSchema, mimeType = 'application/json') {
    super(mimeType);
    this.serializer = new ZodSerializer(schema);
  }
  deserialize(serialized: string) {
    return this.serializer.deserialize(serialized);
  }
}

export type AnyOutputDef = OutputDef<AnyOutputType, AnySerializedType> | undefined;

export type InferOutputType<TOutputDef, TBinary> = TOutputDef extends OutputDef<infer TOutput, infer TSerialized>
  ? TOutput extends Binary
    ? TBinary
    : TOutput
  : void;

// ----------
// Operation
// ----------

export type OperationMethod = 'delete' | 'get' | 'patch' | 'post' | 'put';

export interface OperationDef<TInputDef, TOutputDef> {
  path: string;
  method: OperationMethod;
  inputDef: TInputDef;
  outputDef?: TOutputDef;
}

export type AnyOperationDef = OperationDef<AnyInputDef, AnyOutputDef>;

export type InferOperationFunctionType<TOperationDef, TBinary, TContext = unknown> = TOperationDef extends OperationDef<
  infer TInputDef,
  infer TOutputDef
>
  ? unknown extends TContext
    ? (input: InferInputType<TInputDef, TBinary>) => Promise<InferOutputType<TOutputDef, TBinary>>
    : (input: InferInputType<TInputDef, TBinary>, context: TContext) => Promise<InferOutputType<TOutputDef, TBinary>>
  : never;

// -----------
// Controller
// -----------

export type ControllerDef = Record<string, AnyOperationDef>;

// --------------
// Implementation
// --------------

interface Operation<TOperationDef> {
  def: TOperationDef;
  impl: Function;
}

export type AnyOperation = Operation<AnyOperationDef>;

export type ControllerOperations = Record<string, AnyOperation>;

export type ControllerImpl = {
  operations: ControllerOperations;
  createContext?: () => Promise<any>;
};

export type InferControllerImplType<TDef, TContext> = TDef extends ControllerDef
  ? { [TKey in keyof TDef]: InferOperationFunctionType<TDef[TKey], Buffer, TContext> }
  : never;

export type InferControllerClientType<T> = T extends ControllerDef
  ? { [TKey in keyof T]: InferOperationFunctionType<T[TKey], Blob> }
  : never;
