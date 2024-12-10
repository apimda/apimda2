/* eslint-disable @typescript-eslint/no-unused-vars */
import { createFetchClient } from '@apimda/client';
import { a } from '@apimda/core';
import { createRequestListener } from '@apimda/server';
import { createServer } from 'node:http';
import { z } from 'zod';

const definition = a.controller('/path').define({
  greet: a.op
    .get('/greet')
    .input({
      name: a.in.query(z.string()),
      age: a.in.query(z.number())
    })
    .output(a.out.text()),
  hello: a.op.get('/hello').output(a.out.text('text/plain')),

  log: a.op.get('/log'),

  outputSchema: a.op.get('/outputSchema').output(a.out.schema(z.string().min(1), 'text/vcard')),
  echoObject: a.op
    .post('/echoObject')
    .input({ data: a.in.body(z.object({})) })
    .output(a.out.object()),
  echoText: a.op.post('/echoText').input({ data: a.in.bodyText() }).output(a.out.text()),

  echoBinary: a.op.post('/echoBinary').input({ data: a.in.bodyBinary() }).output(a.out.binary()),

  add: a.op
    .get('/add/{first}')
    .input({
      first: a.in.path(z.number()),
      second: a.in.query(z.number())
    })
    .output(a.out.number()),

  patch: a.op
    .patch('/patch/{id}')
    .input({
      id: a.in.path(z.number().int().positive()),
      data: a.in.body(z.object({ rating: z.number().int().min(1).max(5).nullable() }))
    })
    .output(a.out.number())
});

const implementation = a.implement(
  definition,
  (() => {
    const ctx = {
      greeting: 'Hi'
    };

    return {
      greet: async ({ name, age }) => `${ctx.greeting} ${name}, age: ${age}`,

      hello: async () => 'Hi Joe!',

      log: async () => console.log('Hi Joe!'),

      outputSchema: async () => 'my card or whatever',

      echoObject: async ({ data }) => data,

      echoText: async ({ data }) => data,

      echoBinary: async ({ data }) => data,

      add: async ({ first, second }) => first + second,

      patch: async ({ id, data }) => data.rating ?? 0
    };
  })()
);

console.log(`Starting HTTP server...`);
const listener = createRequestListener({}, implementation);
const server = createServer({ keepAliveTimeout: 1 }, listener);
const port = 8080;
server.listen(port);
console.log(`Started HTTP server on port ${port}`);

const client = createFetchClient(definition, 'http://localhost:8080');
//    ^?

type clientType = typeof client;
//    ^?

const response = await client.greet({ name: 'me', age: 18 });
console.log(response);

const textResponse = await client.echoText({ data: 'some text' });
console.log(textResponse);

const objResponse = await client.echoObject({ data: {} });
console.log(objResponse);

const blob = new Blob(['hello from blob-land']);
const binaryResponse = await client.echoBinary({ data: blob });
console.log(await binaryResponse.text());

const patchRes = await client.patch({ id: 1, data: { rating: 2 } });
console.log(patchRes);

server.close();
