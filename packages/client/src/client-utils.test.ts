import { describe, expect, test } from 'vitest';
import { buildHeaders, buildPath, buildQuery, buildUrl, encodeCookies, paramStringValue } from './client-utils.js';

describe('buildPath', () => {
  test('no template vars', () => {
    expect(buildPath('/users', { foo: 'bar' })).toBe('/users');
  });
  test('expected input', () => {
    expect(buildPath('/users/{userId}/accounts/{accountId}', { userId: 'uid', accountId: 'aid' })).toBe(
      '/users/uid/accounts/aid'
    );
  });
  test('additional path variables', () => {
    expect(buildPath('/users/{userId}', { userId: 'uid', foo: 'bar' })).toBe('/users/uid');
  });
  test('missing path variables', () => {
    expect(() => {
      buildPath('/users/{userId}/accounts/{accountId}', { userId: 'uid' });
    }).toThrow();
  });
  test('encodes URI', () => {
    const userId = ' { / } ';
    expect(buildPath('/users/{userId}', { userId })).toBe(`/users/${encodeURIComponent(userId)}`);
  });
});

describe('buildQuery', () => {
  test('empty params', () => {
    expect(buildQuery({})).toBe('');
  });
  test('many params', () => {
    expect(buildQuery({ k1: 'v1', k2: 'v2', k3: 'v3' })).toBe('?k1=v1&k2=v2&k3=v3');
  });
  test('encodes URI keys and values', () => {
    const k = ' /// ';
    const v = ' { / } ';
    expect(buildQuery({ [k]: v })).toBe(`?${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  });
});

describe('paramStringValue', () => {
  test('number', () => {
    expect(paramStringValue(5)).toBe('5');
  });
  test('boolean', () => {
    expect(paramStringValue(true)).toBe('true');
  });
  test('string', () => {
    expect(paramStringValue('myString')).toBe('myString');
  });
  test('object', () => {
    const obj = { name: 'aName', age: 65 };
    expect(paramStringValue(obj)).toBe(JSON.stringify(obj));
  });
});

// describe('paramsByNameForLocation', () => {
//   test('empty input', () => {
//     const inputDef: Record<string, BaseParam> = {};
//     const input = {};
//     expect(paramsByNameForLocation(inputDef, input, 'query')).toStrictEqual({});
//   });
//   test('simple', () => {
//     const inputDef: Record<string, BaseParam> = { propName: { location: 'query' } };
//     const input = { propName: 'value' };
//     expect(paramsByNameForLocation(inputDef, input, 'query')).toStrictEqual(input);
//   });
//   test('extracts string value', () => {
//     const inputDef: Record<string, BaseParam> = { propName: { location: 'query' } };
//     const input = { propName: 6 };
//     expect(paramsByNameForLocation(inputDef, input, 'query')).toStrictEqual({ propName: '6' });
//   });
//   test('filter by location', () => {
//     const inputDef: Record<string, BaseParam> = { p1: { location: 'query' }, p2: { location: 'path' } };
//     const input = { p1: 'v1', p2: 'v2' };
//     expect(paramsByNameForLocation(inputDef, input, 'path')).toStrictEqual({ p2: 'v2' });
//   });
//   test('filter out undefined values', () => {
//     const inputDef: Record<string, BaseParam> = { p1: { location: 'header' }, p2: { location: 'header' } };
//     const input = { p1: undefined, p2: 'v2' };
//     expect(paramsByNameForLocation(inputDef, input, 'header')).toStrictEqual({ p2: 'v2' });
//   });
//   test('use param name as key if available; fallback to property name', () => {
//     const inputDef: Record<string, BaseParam> = {
//       p1: { location: 'query' },
//       p2: { location: 'query', name: 'newP2' }
//     };
//     const input = { p1: 'v1', p2: 'v2' };
//     expect(paramsByNameForLocation(inputDef, input, 'query')).toStrictEqual({ p1: 'v1', newP2: 'v2' });
//   });
// });

describe('buildUrl', () => {
  test('empty input', () => {
    const endpoint = 'http://localhost:8080';
    const path = '/hello';
    expect(buildUrl(endpoint, path, {}, {})).toStrictEqual(`${endpoint}${path}`);
  });
  test('path and query string', () => {
    const endpoint = 'http://localhost:8080';
    const path = '/users/{userId}';
    const pathVars = { userId: '11111' };
    const queryVars = { q: 'queryValue' };
    expect(buildUrl(endpoint, path, pathVars, queryVars)).toStrictEqual(`${endpoint}/users/11111?q=queryValue`);
  });
});

describe('encodeCookies', () => {
  test('empty cookies returns undefined', () => {
    expect(encodeCookies({})).toBeUndefined();
  });
  test('many cookies', () => {
    expect(encodeCookies({ k1: 'v1', k2: 'v2', k3: 'v3' })).toBe('k1=v1;k2=v2;k3=v3');
  });
});

describe('buildHeaders', () => {
  test('no input', () => {
    expect(buildHeaders({}, {})).toStrictEqual({});
  });
  test('header', () => {
    const headers = { h: 'headerVal' };
    expect(buildHeaders(headers, {})).toStrictEqual({ h: 'headerVal' });
  });
  test('cookie', () => {
    const cookies = { c: 'cookieVal' };
    expect(buildHeaders({}, cookies)).toStrictEqual({ Cookie: 'c=cookieVal' });
  });
  test('header and cookie', () => {
    const headers = { h: 'headerVal' };
    const cookies = { c: 'cookieVal' };
    expect(buildHeaders(headers, cookies)).toStrictEqual({ h: 'headerVal', Cookie: 'c=cookieVal' });
  });
});

// describe('handleStringResult', () => {
//   test('undefined', () => {
//     expect(handleStringResult({ serializeAs: 'string' }, undefined)).toBeUndefined();
//   });
//   test('string', () => {
//     expect(handleStringResult({ serializeAs: 'string' }, 'myString')).toBe('myString');
//     expect(handleStringResult({ serializeAs: 'string' }, '12')).toBe('12');
//     expect(handleStringResult({ serializeAs: 'string' }, 'true')).toBe('true');
//     expect(handleStringResult({ serializeAs: 'string' }, '{}')).toBe('{}');
//   });
//   test('JSON parsed types', () => {
//     expect(handleStringResult(number(), '12')).toBe(12);
//     expect(handleStringResult(boolean(), 'true')).toBe(true);
//     expect(handleStringResult(object(), '{}')).toStrictEqual({});
//     expect(() => handleStringResult(number(), 'text')).toThrow();
//     expect(() => handleStringResult(boolean(), 'text')).toThrow();
//     expect(() => handleStringResult(object(), 'text')).toThrow();
//   });
//   test('zod', () => {
//     expect(handleStringResult(schema(z.string()), 'true')).toBe('true');
//     expect(handleStringResult(schema(z.boolean()), 'true')).toBe(true);
//     expect(handleStringResult(schema(z.number()), '1')).toBe(1);
//     expect(handleStringResult(schema(z.object({})), '{}')).toStrictEqual({});
//     expect(() => handleStringResult(schema(z.number()), 'text')).toThrow();
//     expect(() => handleStringResult(schema(z.boolean()), 'text')).toThrow();
//     expect(() => handleStringResult(schema(z.object({})), 'text')).toThrow();
//     expect(() => handleStringResult(schema(z.string().min(100)), 'a')).toThrow();
//   });
// });
