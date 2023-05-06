import { expect, test } from '@jest/globals';
import { helloImpl } from './implementation';

test('default message', async () => {
  expect(await helloImpl.testClient().hello({ message: undefined })).toEqual('Hello world');
});

test('specific message', async () => {
  expect(await helloImpl.testClient().hello({ message: 'Joe!' })).toEqual('Hello Joe!');
});
