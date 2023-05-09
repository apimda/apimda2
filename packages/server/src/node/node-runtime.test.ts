import { a } from '@apimda/core';
import { createServer } from 'http';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { createRequestListener } from './node-runtime.js';

const greeting = { greeting: 'Hi!' };

const def = a.controller('/greeter').define({
  hello: a.op.get('/hello').output(a.out.object()).build()
});

const impl = a.implement(def).as({ hello: async () => greeting });

const server = createServer(createRequestListener(impl));

describe('createRequestListener tests', () => {
  test('missing route', async () => {
    const response = await request(server).get('/greeter/hi');
    expect(response.status).toEqual(404);
    expect(response.headers['content-type']).toEqual('text/plain');
  });
  test('simple w/out context', async () => {
    const response = await request(server).get('/greeter/hello');
    expect(response.status).toEqual(200);
    expect(response.headers['content-type']).toStrictEqual('application/json');
    expect(response.body).toStrictEqual(greeting);
  });
});
