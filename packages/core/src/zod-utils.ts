/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodFirstPartyTypeKind, ZodSchema, z } from 'zod';

export function fullyUnwrap(s: ZodSchema) {
  let result = s as Record<string, any>;
  while (result['unwrap'] !== undefined) {
    result = result['unwrap']();
  }
  return result as ZodSchema;
}

export function extractTypeName(s: ZodSchema) {
  return (s._def as Record<string, any>)['typeName'] as ZodFirstPartyTypeKind;
}

export function preParseString(
  zodTypeName: ZodFirstPartyTypeKind,
  data?: string
): boolean | number | object | string | undefined {
  if (!data) {
    return data;
  } else if (
    zodTypeName === ZodFirstPartyTypeKind.ZodBoolean ||
    zodTypeName === ZodFirstPartyTypeKind.ZodNumber ||
    zodTypeName === ZodFirstPartyTypeKind.ZodObject ||
    zodTypeName === ZodFirstPartyTypeKind.ZodArray
  ) {
    return JSON.parse(data) as boolean | number | object;
  } else if (zodTypeName === ZodFirstPartyTypeKind.ZodString || zodTypeName === ZodFirstPartyTypeKind.ZodEnum) {
    return data;
  }
  throw new Error(`Cannot pre-parse '${data}' with for type:\n${JSON.stringify(zodTypeName, undefined, 2)}`);
}

export class ZodSerializer<TSchema extends ZodSchema> {
  public readonly unwrappedSchema: ZodSchema;
  public readonly unwrappedTypeKind: ZodFirstPartyTypeKind;
  constructor(public schema: TSchema) {
    this.unwrappedSchema = fullyUnwrap(schema);
    this.unwrappedTypeKind = extractTypeName(this.unwrappedSchema);
  }
  deserialize(serialized?: string): z.TypeOf<TSchema> {
    return this.schema.parse(preParseString(this.unwrappedTypeKind, serialized));
  }
}
