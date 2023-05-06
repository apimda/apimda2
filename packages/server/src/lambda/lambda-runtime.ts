import { ControllerImpl } from '@apimda/core';
import type { APIGatewayProxyEventV2 as Event, APIGatewayProxyStructuredResultV2 as Result } from 'aws-lambda';
import { ContextHolder, ServerOperation, ServerResult } from '../server-framework';
import { LambdaExtractor } from './lambda-extractor';

export const toLambdaCookies = (cookies?: Record<string, string | number | boolean>): string[] | undefined => {
  if (!cookies) {
    return undefined;
  }
  const result: string[] = [];
  for (const cookieName in cookies) {
    result.push(`${cookieName}=${cookies[cookieName]}`);
  }
  return result;
};

export const toLambdaResult = (result: ServerResult): Result => {
  const isBase64Encoded = Buffer.isBuffer(result.body);
  return {
    statusCode: result.statusCode,
    headers: result.headers,
    cookies: toLambdaCookies(result.cookies),
    body: isBase64Encoded ? (result.body as Buffer).toString('base64') : (result.body as string | undefined),
    isBase64Encoded
  };
};

export function createAwsLambdaHandler(...controllers: ControllerImpl[]) {
  const operationsByPath: Record<string, ServerOperation> = {};
  for (const controller of controllers) {
    const contextHolder = new ContextHolder(controller.createContext);
    Object.values(controller.operations).forEach(operation => {
      const routePath = `${operation.def.method.toUpperCase()} ${operation.def.path}`;
      operationsByPath[routePath] = new ServerOperation(operation, contextHolder);
    });
  }

  return async (event: Event) => {
    const extractor = new LambdaExtractor(event);
    const operation = operationsByPath[event.routeKey];
    if (!operation) {
      return toLambdaResult({ statusCode: 404, headers: { 'content-type': 'text/plain' } });
    }
    const result = await operation.execute(extractor);
    return toLambdaResult(result);
  };
}
