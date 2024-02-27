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

export type AnyParamType = undefined | boolean | number | object | string | bigint | Binary;
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

type NotUndefinedKeys<T> = {
  [P in keyof T]: T[P] extends Exclude<T[P], undefined> ? P : never;
}[keyof T];

export type InferRawInputType<TInputDef, TBinary> = TInputDef extends AnyInputDef
  ? { [TKey in keyof TInputDef]: InferParamType<TInputDef[TKey], TBinary> }
  : never;

export type InferInputType<TInputDef, TBinary> = Partial<InferRawInputType<TInputDef, TBinary>> &
  Pick<InferRawInputType<TInputDef, TBinary>, NotUndefinedKeys<InferRawInputType<TInputDef, TBinary>>>;

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

export type InferOperationFunctionType<TOperationDef, TBinary> = TOperationDef extends OperationDef<
  infer TInputDef,
  infer TOutputDef
>
  ? (input: InferInputType<TInputDef, TBinary>) => Promise<InferOutputType<TOutputDef, TBinary>>
  : never;

// -----------
// Controller
// -----------

export type ControllerDef = Record<string, AnyOperationDef>;

export type ControllerImpl<TDefinition extends ControllerDef> = {
  definition: TDefinition;
  implementation: InferControllerImplType<TDefinition>;
};

export type AnyControllerImpl = ControllerImpl<ControllerDef>;

type InferControllerOperationsType<TDef, TBinary> = TDef extends ControllerDef
  ? { [TKey in keyof TDef]: InferOperationFunctionType<TDef[TKey], TBinary> }
  : never;

export type InferControllerImplType<T> = InferControllerOperationsType<T, Buffer>;
export type InferControllerClientType<T> = InferControllerOperationsType<T, Blob>;
