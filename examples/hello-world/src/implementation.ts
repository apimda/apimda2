import { a } from '@apimda/core';
import { createAwsLambdaHandler } from '@apimda/server';
import { helloController } from './definition.js';

export const helloImpl = a.implement(helloController, {
  hello: async ({ message }) => `Hello ${message ?? 'world'}`
});

export const handler = createAwsLambdaHandler(helloImpl);
