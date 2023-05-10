/* eslint-disable @typescript-eslint/no-unused-vars */
import { createFetchClient } from '@apimda/client';
import { InferControllerClientType, a } from '@apimda/core';
import { createRequestListener } from '@apimda/server';
import { createServer } from 'http';
import { z } from 'zod';

const definition = a.controller('/path').define({
  greet: a.op
    .get('/greet')
    .input({
      name: a.in.query(z.string()),
      age: a.in.query(z.number())
    })
    .output(a.out.text())
    .build(),

  hello: a.op.get('/hello').output(a.out.text('text/plain')).build(),

  log: a.op.get('/log').build(),

  outputSchema: a.op
    .get('/outputSchema')
    .output(a.out.schema(z.string().min(1), 'text/vcard'))
    .build(),

  echoObject: a.op
    .post('/echoObject')
    .input({ data: a.in.body(z.object({})) })
    .output(a.out.object())
    .build(),

  echoText: a.op.post('/echoText').input({ data: a.in.bodyText() }).output(a.out.text()).build(),

  echoBinary: a.op.post('/echoBinary').input({ data: a.in.bodyBinary() }).output(a.out.binary()).build(),

  add: a.op
    .get('/add/{first}')
    .input({
      first: a.in.path(z.number()),
      second: a.in.query(z.number())
    })
    .output(a.out.number())
    .build() //async ({ first, second }) => first + second
});

const createContext = async () => {
  return {
    greeting: 'Hi'
  };
};

const implementation = a.implement(definition, createContext).as({
  greet: async ({ name, age }, ctx) => `${ctx.greeting} ${name}, age: ${age}`,

  hello: async () => 'Hi Joe!',

  log: async () => console.log('Hi Joe!'),

  outputSchema: async () => 'my card or whatever',

  echoObject: async ({ data }) => data,

  echoText: async ({ data }) => data,

  echoBinary: async ({ data }) => data,

  add: async ({ first, second }) => first + second
});

type opType3 = InferControllerClientType<typeof definition>;
//   ^?

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

(async () => {
  const response = await client.greet({ name: 'me', age: 18 });
  console.log(response);

  const textResponse = await client.echoText({ data: 'some text' });
  console.log(textResponse);

  const objResponse = await client.echoObject({ data: {} });
  console.log(objResponse);

  const blob = new Blob(['hello from blob-land']);
  const binaryResponse = await client.echoBinary({ data: blob });
  console.log(await binaryResponse.text());

  server.close();
})();

/*
 APIMDA default content-type:
  -> if string return text/plain
  -> if buffer return application/octet-stream
  -> if object return application/json

  ...use .setContentType(contentType) to specify content-type
  ...or ApimdaResult<T> for custom response (but if content-type header is NOT specified, use defaults)
    -> should ApimdaResult<T> be a class ...???  TODO: think about branding ApimdaResult<T>
    -> ...maybe factory function, e.g. return apimdaResult(result, {statusCode?, headers?, cookies?})


  OLD ideas:
  interface MyContext {
    hello: string;
  }


  const myController = controller<MyContext>({
    hello: get('/hello')
      .input({
          name: query(z.string()),
          age: query()
      })
      .output(text('text/plain'))
      .build(({name, age}, context) => `${context.hello} ${name}, age: ${age}`)
    })
  }).build(); 


  const myControllerDef = controller({
    hello: get('/hello')
      .input({
        name: query(z.string()),
        age: query()
      })
      .output(text('text/plain'))
    })
  ).buildDef(); 


  const myController = controller<MyContext>(method => ({
    hello: method.get('/hello')
      .input(in => ({
        name: in.query(z.string()),
        age: in.query()
      }))
      .output(out => out.text('text/plain'))
      .build(({name, age}, context) => `${context.hello} ${name}, age: ${age}`)
  })).build(); 




  .output(schema({
    name: query(z.string().uuid()),
    age: query(z.number().min(30))
  }))
  .output(binary('image/png'))
  .output(text('text/html'))
  .output(binary('image/png'), {
    statusCode?: HttpSuccessStatusCode | HttpRedirectStatusCode;
    headers?: Record<string, string | boolean | number>;
    cookies?: Record<string, string | boolean | number>;
  })
*/
