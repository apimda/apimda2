import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { a } from './api.js';
import { ValidationError, ViolationCode } from './validation.js';

describe('validation', () => {
  test('DUPLICATE_METHOD_PATH', () => {
    try {
      a.controller().define({
        one: a.op.get('/path'),
        two: a.op.get('/path')
      });
      throw new Error('Expected ValidationError');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const v = (e as ValidationError).validationResult.violations;
      expect(v).toHaveLength(1);
      expect(v[0].code).toBe(ViolationCode.DUPLICATE_METHOD_PATH);
    }
  });
  test('INVALID_PATH', () => {
    try {
      a.controller('').define({
        one: a.op.get(''),
        two: a.op.get('path'),
        three: a.op.get('/path/')
      });
      throw new Error('Expected ValidationError');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const v = (e as ValidationError).validationResult.violations;
      expect(v).toHaveLength(3);
      for (const violation of v) {
        expect(violation.code).toBe(ViolationCode.INVALID_PATH);
      }
    }
  });
  test('MISSING_PATH_VAR', () => {
    try {
      a.controller().define({
        one: a.op.get('/path/{missing}')
      });
      throw new Error('Expected ValidationError');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const v = (e as ValidationError).validationResult.violations;
      expect(v).toHaveLength(1);
      expect(v[0].code).toBe(ViolationCode.MISSING_PATH_VAR);
    }
  });
  test('INVALID_PATH_VAR', () => {
    try {
      a.controller().define({
        one: a.op.get('/path/{var}').input({ var: a.in.path(z.object({})) })
      });
      throw new Error('Expected ValidationError');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const v = (e as ValidationError).validationResult.violations;
      expect(v).toHaveLength(1);
      expect(v[0].code).toBe(ViolationCode.INVALID_PATH_VAR);
    }
  });
  test('MULTIPLE_BODY_VARS', () => {
    try {
      a.controller().define({
        one: a.op.get('/path').input({ first: a.in.bodyText(), second: a.in.bodyBinary() })
      });
      throw new Error('Expected ValidationError');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const v = (e as ValidationError).validationResult.violations;
      expect(v).toHaveLength(1);
      expect(v[0].code).toBe(ViolationCode.MULTIPLE_BODY_VARS);
    }
  });
});
