import { ControllerImpl } from '@apimda/core';
import { IncomingMessage, ServerResponse } from 'node:http';
import { HttpErrorStatusCode, statusCodeToDesc } from '../http-status';
import { ContextHolder, ServerOperation, ServerResult } from '../server-framework';
import { NodeExtractor } from './node-extractor';
import { RouteMatcher } from './route-matcher';

const sendErrorResponse = (response: ServerResponse, statusCode: HttpErrorStatusCode) => {
  response.writeHead(statusCode, { 'content-type': 'text/plain' });
  response.write(statusCodeToDesc[statusCode]);
  response.end();
};

const sendResultResponse = (response: ServerResponse, result: ServerResult) => {
  const outgoingHeaders: Record<string, string | string[]> = {};
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
  response.write(result.body);
  response.end();
};

export const createRequestListener = (...controllers: ControllerImpl[]) => {
  const routeMatcher = new RouteMatcher<ServerOperation>();
  for (const controller of controllers) {
    const contextHolder = new ContextHolder(controller.createContext);
    Object.values(controller.operations).forEach(operation => {
      const routePath = `${operation.def.method}/${operation.def.path}`;
      routeMatcher.add(routePath, new ServerOperation(operation, contextHolder));
    });
  }

  return async (request: IncomingMessage, response: ServerResponse) => {
    try {
      if (!request.url) {
        sendErrorResponse(response, 404);
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
      sendResultResponse(response, result);
    } catch (e) {
      sendErrorResponse(response, 500);
    }
  };
};
