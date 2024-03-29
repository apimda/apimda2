import { AnyControllerImpl } from '@apimda/core';
import { IncomingMessage, ServerResponse } from 'node:http';
import { HttpErrorStatusCode, statusCodeToDesc } from '../http-status.js';
import { ServerOperation, ServerResult } from '../server-framework.js';
import { NodeExtractor } from './node-extractor.js';
import { RouteMatcher } from './route-matcher.js';

export const enableCorsHeaders = { 'Access-Control-Allow-Origin': '*' };

const sendOptionsResponse = (response: ServerResponse, defaultHeaders: Record<string, string>) => {
  response.writeHead(204, defaultHeaders);
  response.end();
};

const sendErrorResponse = (response: ServerResponse, statusCode: HttpErrorStatusCode) => {
  response.writeHead(statusCode, { 'content-type': 'text/plain' });
  response.write(statusCodeToDesc[statusCode]);
  response.end();
};

const sendResultResponse = (response: ServerResponse, result: ServerResult, defaultHeaders: Record<string, string>) => {
  const outgoingHeaders: Record<string, string | string[]> = defaultHeaders;
  for (const headerName in result.headers) {
    outgoingHeaders[headerName] = result.headers[headerName as Lowercase<string>].toString();
  }
  if (result.body) {
    outgoingHeaders['content-length'] = Buffer.byteLength(result.body).toString();
  }

  const cookies: string[] = [];
  for (const cookieName in result.cookies) {
    cookies.push(`${cookieName}=${result.cookies[cookieName]}`);
  }
  if (cookies.length > 0) {
    outgoingHeaders['set-cookie'] = cookies;
  }
  response.writeHead(result.statusCode, outgoingHeaders);
  if (result.body) {
    response.write(result.body);
  }
  response.end();
};

export const createRequestListener = (
  config: { headers?: Record<string, string> },
  ...controllers: AnyControllerImpl[]
) => {
  const defaultHeaders = config.headers ?? {};
  const routeMatcher = new RouteMatcher<ServerOperation>();
  for (const controller of controllers) {
    for (const operationName in controller.definition) {
      const operation = controller.definition[operationName];
      const routePath = `${operation.method}/${operation.path}`;
      routeMatcher.add(routePath, new ServerOperation(operation, operationName, controller.implementation));
    }
  }

  return async (request: IncomingMessage, response: ServerResponse) => {
    try {
      if (!request.url) {
        sendErrorResponse(response, 404);
        return;
      }
      if (request.method === 'OPTIONS') {
        sendOptionsResponse(response, defaultHeaders);
        return;
      }
      const url = new URL(request.url, 'http://${request.headers.host}');
      const routePath = `${request.method?.toLowerCase() ?? ''}/${url.pathname}`;
      const routeMatch = routeMatcher.match(routePath);
      if (!routeMatch) {
        sendErrorResponse(response, 404);
        return;
      }
      const extractor = await NodeExtractor.create(request, url, routeMatch.pathParameters);
      const operation = routeMatch.value;
      const result = await operation.execute(extractor);
      sendResultResponse(response, result, defaultHeaders);
    } catch (e) {
      sendErrorResponse(response, 500);
    }
  };
};
