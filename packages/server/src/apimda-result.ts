import { HttpRedirectStatusCode, HttpSuccessStatusCode } from './http-status';

export class ApimdaResult<T> {
  readonly result: T;
  readonly statusCode: HttpSuccessStatusCode | HttpRedirectStatusCode;
  readonly headers: Record<string, string | boolean | number>;
  readonly cookies?: Record<string, string | boolean | number>;

  static isApimdaResult(obj: unknown) {
    return obj instanceof ApimdaResult;
  }

  constructor(
    result: T,
    statusCode: HttpSuccessStatusCode | HttpRedirectStatusCode = 200,
    headers: Record<string, string | boolean | number> = {},
    cookies: Record<string, string | boolean | number>
  ) {
    this.result = result;
    this.statusCode = statusCode;
    this.headers = headers;
    this.cookies = cookies;
  }
}
