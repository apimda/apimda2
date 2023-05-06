import { HttpErrorStatusCode, statusCodeToDesc } from './http-status';

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: HttpErrorStatusCode, message?: string) {
    super(message ? message : statusCodeToDesc[statusCode]);
    this.statusCode = statusCode;
  }
}
