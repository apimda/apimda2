import type { APIGatewayProxyEventV2 as Event } from 'aws-lambda';
import { HttpError } from '../http-error';
import { RequestExtractor } from '../server-framework';

export class LambdaExtractor implements RequestExtractor {
  private cookies?: Map<string, string>;

  constructor(private event: Event) {}

  private parseCookies() {
    const result = new Map<string, string>();
    if (this.event.cookies) {
      for (const cookie of this.event.cookies) {
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
    if (!this.event.body) {
      return undefined;
    }
    if (!this.event.isBase64Encoded) {
      throw new HttpError(400, 'Expected binary input');
    }
    return Buffer.from(this.event.body, 'base64');
  }

  bodyText(): string | undefined {
    return this.event.body;
  }

  cookie(name: string): string | undefined {
    if (!this.cookies) {
      this.cookies = this.parseCookies();
    }
    return this.cookies.get(name);
  }

  header(name: string): string | undefined {
    return (this.event.headers || {})[name.toLowerCase()];
  }

  query(name: string): string | undefined {
    return (this.event.queryStringParameters || {})[name];
  }

  path(name: string): string | undefined {
    return (this.event.pathParameters || {})[name];
  }
}
