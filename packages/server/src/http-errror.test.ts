import { describe, expect, test } from '@jest/globals';

import { HttpError } from './http-error';
import { statusCodeToDesc } from './http-status';

describe('HTTP error tests', () => {
  test('top level app', () => {
    expect(new HttpError(500).statusCode).toBe(500);
    expect(new HttpError(500).message).toBe(statusCodeToDesc[500]);
    expect(new HttpError(500, 'msg').message).toBe('msg');
  });
});
