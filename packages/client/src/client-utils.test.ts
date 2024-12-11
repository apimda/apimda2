import { AnyInputDef, a } from '@apimda/core';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import {
  buildHeaders,
  buildPath,
  buildQuery,
  buildUrl,
  encodeCookies,
  getHttpMethod,
  paramStringValue,
  paramsByLocation
} from './client-utils.js';

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

describe('getHttpMethod', () => {
  test('delete', () => {
    expect(getHttpMethod({ method: 'delete', path: '/', inputDef: {} })).toBe('DELETE');
  });
  test('get', () => {
    expect(getHttpMethod({ method: 'get', path: '/', inputDef: {} })).toBe('GET');
  });
  test('patch', () => {
    expect(getHttpMethod({ method: 'patch', path: '/', inputDef: {} })).toBe('PATCH');
  });
  test('post', () => {
    expect(getHttpMethod({ method: 'post', path: '/', inputDef: {} })).toBe('POST');
  });
  test('put', () => {
    expect(getHttpMethod({ method: 'put', path: '/', inputDef: {} })).toBe('PUT');
  });
});

describe('paramsByLocation', () => {
  test('empty input', () => {
    const inputDef: AnyInputDef = {};
    const input = {};
    const result = paramsByLocation(inputDef, input);
    expect(result.params.cookie).toStrictEqual({});
    expect(result.params.header).toStrictEqual({});
    expect(result.params.path).toStrictEqual({});
    expect(result.params.query).toStrictEqual({});
    expect(result.body).toBeUndefined();
    expect(result.bodyType).toBeUndefined();
  });
  test('simple', () => {
    const inputDef: AnyInputDef = { paramName: a.in.query(z.string(), 'paramName') };
    const input = { paramName: 'value' };
    const result = paramsByLocation(inputDef, input);
    expect(result.params.query).toStrictEqual(input);
  });
  test('extracts string value', () => {
    const inputDef: AnyInputDef = { paramName: a.in.path(z.number(), 'paramName') };
    const input = { paramName: 6 };
    const result = paramsByLocation(inputDef, input);
    expect(result.params.path).toStrictEqual({ paramName: '6' });
  });
  test('filter out undefined values', () => {
    const inputDef: AnyInputDef = { p1: a.in.header(z.string().optional(), 'p1'), p2: a.in.header(z.string(), 'p2') };
    const input = { p1: undefined, p2: 'v2' };
    const result = paramsByLocation(inputDef, input);
    expect(result.params.header).toStrictEqual({ p2: 'v2' });
  });
  test('use param name as key if available; fallback to property name', () => {
    const inputDef: AnyInputDef = { p1: a.in.query(z.string(), 'p1'), p2: a.in.query(z.string(), 'newP2') };
    const input = { p1: 'v1', p2: 'v2' };
    const result = paramsByLocation(inputDef, input);
    expect(result.params.query).toStrictEqual({ p1: 'v1', newP2: 'v2' });
  });
  test('body text', () => {
    const inputDef: AnyInputDef = { data: a.in.bodyText() };
    const input = { data: 'value' };
    const result = paramsByLocation(inputDef, input);
    expect(result.body).toStrictEqual(input.data);
    expect(result.bodyType).toStrictEqual('text/plain');
  });
  test('body binary', () => {
    const inputDef: AnyInputDef = { data: a.in.bodyBinary() };
    const input = { data: new Blob(['value'], { type: 'plain/text' }) };
    const result = paramsByLocation(inputDef, input);
    expect(result.body).toStrictEqual(input.data);
    expect(result.bodyType).toStrictEqual('application/octet-stream');
  });
  test('body json', () => {
    const inputDef: AnyInputDef = { data: a.in.body(z.object({ msg: z.string() })) };
    const input = { data: { msg: 'value' } };
    const result = paramsByLocation(inputDef, input);
    expect(JSON.parse(result.body as string)).toStrictEqual(input.data);
    expect(result.bodyType).toStrictEqual('application/json');
  });
});

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
    expect(buildHeaders({}, {}, undefined)).toStrictEqual({});
  });
  test('header', () => {
    const headers = { h: 'headerVal' };
    expect(buildHeaders(headers, {}, undefined)).toStrictEqual({ h: 'headerVal' });
  });
  test('cookie', () => {
    const cookies = { c: 'cookieVal' };
    expect(buildHeaders({}, cookies, undefined)).toStrictEqual({ Cookie: 'c=cookieVal' });
  });
  test('header and cookie', () => {
    const headers = { h: 'headerVal' };
    const cookies = { c: 'cookieVal' };
    expect(buildHeaders(headers, cookies, undefined)).toStrictEqual({ h: 'headerVal', Cookie: 'c=cookieVal' });
  });
  test('header and cookie and body', () => {
    const headers = { h: 'headerVal' };
    const cookies = { c: 'cookieVal' };
    expect(buildHeaders(headers, cookies, 'text/plain')).toStrictEqual({
      h: 'headerVal',
      Cookie: 'c=cookieVal',
      'Content-Type': 'text/plain'
    });
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
