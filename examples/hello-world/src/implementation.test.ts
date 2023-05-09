import { expect, test } from 'vitest';
import { helloImpl } from './implementation.js';

test('default message', async () => {
  expect(await helloImpl.testClient().hello({ message: undefined })).toEqual('Hello world');
});

test('specific message', async () => {
  expect(await helloImpl.testClient().hello({ message: 'Joe!' })).toEqual('Hello Joe!');
});
