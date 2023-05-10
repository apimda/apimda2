import { createFetchClient } from '@apimda/client';
import { InferControllerClientType } from '@apimda/core';
import { createRequestListener } from '@apimda/server';
import { Server, createServer } from 'http';
import { AddressInfo } from 'net';
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';
import { testControllerDef, testControllerImpl } from './test-controller.js';

let server: Server;
let client: InferControllerClientType<typeof testControllerDef>;

beforeAll(() => {
  server = createServer({ keepAliveTimeout: 1 }, createRequestListener({}, testControllerImpl));
  server.listen();
});

beforeEach(async () => {
  const address = server.address() as AddressInfo;
  client = createFetchClient(testControllerDef, `http://localhost:${address.port}`);
});

afterAll(() => {
  server.close();
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
  const input = { body: { id: 100 } };
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
    num: -120
  };
  expect(await client.pathExample(input)).toEqual(input);
});

test('queryExample', async () => {
  const input = {
    bln: true,
    str: 'some text',
    num: -120,
    obj: { id: 0 },
    optional: undefined
  };
  expect(await client.queryExample(input)).toEqual(input);

  const notOptionalInput = {
    ...input,
    optional: 'I am defined!'
  };
  expect(await client.queryExample(notOptionalInput)).toEqual(notOptionalInput);
});
