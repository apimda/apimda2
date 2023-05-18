import { a } from '@apimda/core';
import type { APIGatewayProxyEventV2 as Event } from 'aws-lambda';
import { describe, expect, test } from 'vitest';
import { createAwsLambdaHandler, toLambdaCookies, toLambdaResult } from './lambda-runtime.js';

describe('toLambdaCookies tests', () => {
  test('empty cookies', () => {
    expect(toLambdaCookies({})).toStrictEqual([]);
  });
  test('all the cookies', () => {
    expect(
      toLambdaCookies({
        stringCookie: 'str',
        numberCookie: 42,
        booleanCookie: true
      })
    ).toStrictEqual(['stringCookie=str', 'numberCookie=42', 'booleanCookie=true']);
  });
});

describe('toLambdaResult tests', () => {
  test('minimal result', () => {
    expect(toLambdaResult({ statusCode: 200, headers: {} })).toEqual({
      statusCode: 200,
      headers: {},
      isBase64Encoded: false
    });
  });
  test('full text result', () => {
    expect(
      toLambdaResult({
        statusCode: 200,
        headers: { 'content-type': 'text/html' },
        cookies: { cookieName: 'cookieValue' },
        body: 'body'
      })
    ).toEqual({
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      cookies: ['cookieName=cookieValue'],
      body: 'body',
      isBase64Encoded: false
    });
  });
  test('binary result', () => {
    expect(
      toLambdaResult({
        statusCode: 200,
        headers: { 'content-type': 'text/html' },
        cookies: { cookieName: 'cookieValue' },
        body: Buffer.from('Hello from binary Lambda')
      })
    ).toEqual({
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      cookies: ['cookieName=cookieValue'],
      body: 'SGVsbG8gZnJvbSBiaW5hcnkgTGFtYmRh',
      isBase64Encoded: true
    });
  });
});

const greeting = { hello: 'Hi!' };

const def1 = a.controller('/greeter').define({
  hello: a.op.get('/hello').output(a.out.object()).build()
});

const impl1 = a.implement(def1, { hello: async () => greeting });

const def2 = a.controller('/boo').define({
  yeah: a.op.get('/yo').output(a.out.text()).build()
});

const impl2 = a.implement(def2, { yeah: async () => 'hell yeah' });

const handler = createAwsLambdaHandler(impl1, impl2);

describe('createAwsLambdaHandler tests', () => {
  test('missing route', async () => {
    const event = { routeKey: 'GET /greeter/hi' };
    const result = await handler(event as Event);
    expect(result).toEqual({
      statusCode: 404,
      headers: { 'content-type': 'text/plain' },
      isBase64Encoded: false
    });
  });

  test('createAwsLambdaHandler', async () => {
    const event = { routeKey: 'GET /greeter/hello' };
    const result = await handler(event as Event);
    expect(result).toEqual({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(greeting),
      isBase64Encoded: false
    });
  });
});
