import { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';
import { createGunzip, createInflate } from 'node:zlib';
import getRawBody from 'raw-body';
import { HttpError } from '../http-error.js';
import { RequestExtractor } from '../server-framework.js';

const getBody = async (request: IncomingMessage) => {
  let bodyStream: Readable = request;
  const encoding = request.headers['content-encoding']?.toLowerCase();
  if (encoding === 'deflate') {
    bodyStream = request.pipe(createInflate());
  } else if (encoding === 'gzip') {
    bodyStream = request.pipe(createGunzip());
  }
  return await getRawBody(bodyStream, {
    limit: '10mb', // apigw limit
    length: request.headers['content-length'],
    encoding: null
  });
};

export class NodeExtractor implements RequestExtractor {
  static async create(request: IncomingMessage, url: URL, pathParameters: Map<string, string>) {
    const body = await getBody(request);
    return new NodeExtractor(request, url, pathParameters, body);
  }

  private cookies?: Map<string, string>;

  constructor(
    private readonly request: IncomingMessage,
    private readonly url: URL,
    private readonly pathParameters: Map<string, string>,
    private readonly body?: Buffer
  ) {}

  private parseCookies() {
    const result = new Map<string, string>();
    if (this.request.headers.cookie) {
      const cookiesArray = this.request.headers.cookie.split(';');
      for (const cookie of cookiesArray) {
        const eqIdx = cookie.indexOf('=');
        if (eqIdx > 0) {
          const name = cookie.substring(0, eqIdx);
          const value = cookie.substring(eqIdx + 1);
          result.set(name, value);
        }
      }
    }
    return result;
  }

  bodyBuffer(): Buffer | undefined {
    return this.body;
  }

  bodyText(): string | undefined {
    if (this.body) {
      return this.body.toString('utf8');
    }
    return undefined;
  }

  cookie(name: string): string | undefined {
    if (!this.cookies) {
      this.cookies = this.parseCookies();
    }
    return this.cookies.get(name);
  }

  header(name: string): string | undefined {
    const header = this.request.headers[name.toLowerCase()];
    if (Array.isArray(header)) {
      throw new HttpError(400, `Multi value header '${name}' not supported`);
    }
    return header;
  }

  query(name: string): string | undefined {
    const params = this.url.searchParams.getAll(name);
    if (params.length > 1) {
      throw new HttpError(400, `Multi value query params '${name}' not supported`);
    }
    return params.length ? params[0] : undefined;
  }

  path(name: string): string | undefined {
    return this.pathParameters.get(name);
  }
}
