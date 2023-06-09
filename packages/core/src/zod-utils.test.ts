import { describe, expect, test } from 'vitest';
import { ZodBoolean, ZodEnum, ZodFirstPartyTypeKind, ZodNumber, ZodObject, ZodString, z } from 'zod';
import { fullyUnwrap, preParseString } from './zod-utils.js';

describe('fullyUnwrap', () => {
  test('z.string().optional()', () => {
    expect(fullyUnwrap(z.string().optional())).toBeInstanceOf(ZodString);
  });
  test('z.number().nullable()', () => {
    expect(fullyUnwrap(z.number().nullable())).toBeInstanceOf(ZodNumber);
  });
  test('z.enum().nullable()', () => {
    expect(fullyUnwrap(z.enum(['one', 'two']).nullable())).toBeInstanceOf(ZodEnum);
  });
  test('z.object().nullish()', () => {
    expect(fullyUnwrap(z.object({ one: z.string() }).nullish())).toBeInstanceOf(ZodObject);
  });
  test('z.boolean().nullable().promise().brand()', () => {
    expect(fullyUnwrap(z.boolean().nullable().promise().brand())).toBeInstanceOf(ZodBoolean);
  });
});

function assertJsonPreParse(typeKind: ZodFirstPartyTypeKind) {
  expect(preParseString(typeKind, 'true')).toBe(true);
  expect(preParseString(typeKind, 'false')).toBe(false);
  expect(preParseString(typeKind, '1')).toBe(1);
  expect(preParseString(typeKind, '-1')).toBe(-1);
  expect(preParseString(typeKind, '"string"')).toBe('string');
  expect(preParseString(typeKind, '{}')).toStrictEqual({});
  expect(preParseString(typeKind, '[]')).toStrictEqual([]);
  expect(() => {
    preParseString(typeKind, 'undefined');
  }).toThrow();
  expect(preParseString(typeKind, 'null')).toBeNull();
}

describe('preParseString', () => {
  test('undefined data', () => {
    expect(preParseString(ZodFirstPartyTypeKind.ZodString, undefined)).toBeUndefined();
  });
  test('string schema', () => {
    expect(preParseString(ZodFirstPartyTypeKind.ZodString, 'myString')).toBe('myString');
    expect(preParseString(ZodFirstPartyTypeKind.ZodString, 'true')).toBe('true');
    expect(preParseString(ZodFirstPartyTypeKind.ZodString, '1')).toBe('1');
  });
  test('enum schema', () => {
    expect(preParseString(ZodFirstPartyTypeKind.ZodEnum, 'MY_ENUM_VAL')).toBe('MY_ENUM_VAL');
    expect(preParseString(ZodFirstPartyTypeKind.ZodEnum, 'true')).toBe('true');
    expect(preParseString(ZodFirstPartyTypeKind.ZodEnum, '1')).toBe('1');
  });
  test('bigint schema', () => {
    const biggerThanNumber = BigInt(Number.MAX_SAFE_INTEGER) + 2n;
    expect(preParseString(ZodFirstPartyTypeKind.ZodBigInt, biggerThanNumber.toString())).toBe(biggerThanNumber);
    expect(preParseString(ZodFirstPartyTypeKind.ZodBigInt, '1')).toBe(1n);
    expect(() => {
      preParseString(ZodFirstPartyTypeKind.ZodBigInt, 'true');
    }).toThrow();
    expect(() => {
      preParseString(ZodFirstPartyTypeKind.ZodBigInt, 'undefined');
    }).toThrow();
    expect(() => {
      preParseString(ZodFirstPartyTypeKind.ZodBigInt, '1.02');
    }).toThrow();
  });
  test('boolean schema', () => {
    assertJsonPreParse(ZodFirstPartyTypeKind.ZodBoolean);
  });
  test('number schema', () => {
    assertJsonPreParse(ZodFirstPartyTypeKind.ZodNumber);
  });
  test('object schema', () => {
    assertJsonPreParse(ZodFirstPartyTypeKind.ZodObject);
  });
  test('array schema', () => {
    assertJsonPreParse(ZodFirstPartyTypeKind.ZodArray);
  });
});
