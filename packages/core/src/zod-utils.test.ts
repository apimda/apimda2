import { describe, expect, test } from 'vitest';
import { ZodBoolean, ZodFirstPartyTypeKind, ZodObject, ZodString, z } from 'zod';
import { fullyUnwrap, preParseString } from './zod-utils.js';

describe('fullyUnwrap', () => {
  test('z.string().optional()', () => {
    expect(fullyUnwrap(z.string().optional())).toBeInstanceOf(ZodString);
  });
  test('z.number().nullable()', () => {
    expect(fullyUnwrap(z.string().nullable())).toBeInstanceOf(ZodString);
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
