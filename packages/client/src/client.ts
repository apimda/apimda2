/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyOperationDef, BinaryOutputDef, ControllerDef, InferControllerClientType } from '@apimda/core';
import { buildHeaders, buildUrl, getHttpMethod, paramsByLocation } from './client-utils.js';

// eslint-disable-next-line no-var
declare var fetch: typeof import('undici').fetch;

export interface ClientRequest {
  method: string;
  url: URL;
  headers: Record<string, string>;
  body: string | Blob | undefined;
}

export type ClientRequestInterceptor = (request: ClientRequest) => Promise<ClientRequest>;

export class ClientHttpError extends Error {
  constructor(
    public status: number,
    public message: string
  ) {
    super(message);
  }
}

export class ClientFetchOperation {
  constructor(
    private operationDef: AnyOperationDef,
    private endpoint: string,
    private interceptor?: ClientRequestInterceptor
  ) {}
  private buildRequest(input: Record<string, any>) {
    const { params, body } = paramsByLocation(this.operationDef.inputDef, input);
    const request: ClientRequest = {
      method: getHttpMethod(this.operationDef),
      url: new URL(buildUrl(this.endpoint, this.operationDef.path, params.path, params.query)),
      headers: buildHeaders(params.header, params.cookie),
      body
    };
    return request;
  }

  async execute(input: Record<string, any>) {
    const initialRequest = this.buildRequest(input);
    const request = this.interceptor ? await this.interceptor(initialRequest) : initialRequest;
    const response = await fetch(request.url, { method: request.method, headers: request.headers, body: request.body });
    if (response.ok) {
      const outDef = this.operationDef.outputDef;
      if (!outDef) {
        return;
      } else if (outDef instanceof BinaryOutputDef) {
        const data = await response.blob();
        return data;
      } else {
        const data = await response.text();
        return outDef.deserialize(data);
      }
    } else {
      const errMsg = await response.text();
      throw new ClientHttpError(response.status, errMsg);
    }
  }
}

export function createFetchClient<T extends ControllerDef>(
  controllerDef: T,
  endpoint: string,
  interceptor?: ClientRequestInterceptor
) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const result: Record<string, Function> = {};
  for (const key in controllerDef) {
    const clientOperation = new ClientFetchOperation(controllerDef[key], endpoint, interceptor);
    result[key] = clientOperation.execute.bind(clientOperation);
  }
  return result as InferControllerClientType<T>;
}
