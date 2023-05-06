import { describe, expect, test } from '@jest/globals';
import { z } from 'zod';
import { a } from './api';
import { ValidationError, ViolationCode } from './validation';

describe('validation', () => {
  test('DUPLICATE_METHOD_PATH', () => {
    try {
      a.controller().define({
        one: a.op.get('/path').build(),
        two: a.op.get('/path').build()
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
        one: a.op.get('').build(),
        two: a.op.get('path').build(),
        three: a.op.get('/path/').build()
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
        one: a.op.get('/path/{missing}').build()
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
        one: a.op
          .get('/path/{var}')
          .input({ var: a.in.path(z.object({})) })
          .build()
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
        one: a.op.get('/path').input({ first: a.in.bodyText(), second: a.in.bodyBinary() }).build()
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
