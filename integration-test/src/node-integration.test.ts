import { createFetchClient } from '@apimda/client';
import { InferControllerClientType } from '@apimda/core';
import { createRequestListener } from '@apimda/server';
import { Server, createServer } from 'http';
import { AddressInfo } from 'net';
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';
import { objControllerDef, objControllerImpl, testControllerDef, testControllerImpl } from './test-controller.js';

let server: Server;
let endpoint: string;
let client: InferControllerClientType<typeof testControllerDef>;

beforeAll(async () => {
  const listener = createRequestListener({}, testControllerImpl, objControllerImpl);
  server = createServer({ keepAliveTimeout: 1 }, listener);
  server.listen();
});

beforeEach(async () => {
  const address = server.address() as AddressInfo;
  endpoint = `http://localhost:${address.port}`;
  client = createFetchClient(testControllerDef, endpoint);
});

afterAll(() => {
  server.close();
});

test('ObjController.bindContext', async () => {
  const objClient = createFetchClient(objControllerDef, endpoint);
  expect(await objClient.testBind({})).toEqual('context');
});

test('bodyArrayExample', async () => {
  const input = { body: [1, 2, 3] };
  expect(await client.bodyArrayExample(input)).toEqual(input.body);
});

test('bodyBinaryExample', async () => {
  const text = 'some binary text';
  const input = { body: new Blob([text]) };
  const res = await client.bodyBinaryExample(input);
  expect(await res.text()).toEqual(text);
});

test('bodyObjectExample', async () => {
  const input = { body: { id: 100, bInt: BigInt(Number.MAX_SAFE_INTEGER) + 2n } };
  expect(await client.bodyObjectExample(input)).toEqual(input.body);
});

test('bodyTextExample', async () => {
  const input = { body: 'some text' };
  expect(await client.bodyTextExample(input)).toEqual(input.body);
});

test('cookieExample', async () => {
  const input = {
    bln: true,
    str: 'some text',
    num: -120,
    obj: { id: 0 }
  };
  expect(await client.cookieExample(input)).toEqual(input);
});

test('headerExample', async () => {
  const input = {
    bln: true,
    str: 'some text',
    num: -120,
    obj: { id: 0 }
  };
  expect(await client.headerExample(input)).toEqual(input);
});

test('pathExample', async () => {
  const input = {
    bln: true,
    str: 'some text',
    num: -120,
    bInt: BigInt(Number.MAX_SAFE_INTEGER) + 2n
  };
  expect(await client.pathExample(input)).toEqual(input);
});

test('queryExample', async () => {
  const input = {
    bln: true,
    str: 'some text',
    num: -120,
    bInt: BigInt(Number.MAX_SAFE_INTEGER) + 2n,
    obj: { id: 0 }
  };
  expect(await client.queryExample(input)).toEqual(input);

  const notOptionalInput = {
    ...input,
    optional: 'I am defined!'
  };
  expect(await client.queryExample(notOptionalInput)).toEqual(notOptionalInput);
});

test('voidExample', async () => {
  expect(await client.voidExample({})).toEqual(undefined);
});
