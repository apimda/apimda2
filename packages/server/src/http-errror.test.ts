import { describe, expect, test } from 'vitest';

import { HttpError } from './http-error.js';
import { statusCodeToDesc } from './http-status.js';

describe('HTTP error tests', () => {
  test('top level app', () => {
    expect(new HttpError(500).statusCode).toBe(500);
    expect(new HttpError(500).message).toBe(statusCodeToDesc[500]);
    expect(new HttpError(500, 'msg').message).toBe('msg');
  });
});
