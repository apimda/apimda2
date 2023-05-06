import { describe, expect, test } from '@jest/globals';
import { PathMatcher } from './path-matcher';

const m = (rec: Record<string, string>) => new Map(Object.entries(rec));

describe('PathMatcher tests', () => {
  test('Empty path', () => {
    const info = PathMatcher.parse('');
    expect(info.normalizedPath).toBe('');
    expect(info.pathVars).toHaveLength(0);
  });
  test('Basic path', () => {
    const info = PathMatcher.parse('/');
    expect(info.normalizedPath).toBe('/');
    expect(info.pathVars).toHaveLength(0);
    expect(info.match('/')).toStrictEqual(m({}));
    expect(info.match('/users')).toBeUndefined();
  });
  test('Normal API path', () => {
    const info = PathMatcher.parse('/users/{userId}');
    expect(info.normalizedPath).toBe('/users/{}');
    expect(info.pathVars).toStrictEqual(['userId']);
    expect(info.match('/')).toBeUndefined();
    expect(info.match('/users')).toBeUndefined();
    expect(info.match('/users/one')).toStrictEqual(m({ userId: 'one' }));
    expect(info.match('/users/one/two')).toBeUndefined();
  });
  test('Normal API path with two params', () => {
    const info = PathMatcher.parse('/users/{userId}/cars/{carId}');
    expect(info.normalizedPath).toBe('/users/{}/cars/{}');
    expect(info.pathVars).toStrictEqual(['userId', 'carId']);
    expect(info.match('/')).toBeUndefined();
    expect(info.match('/users')).toBeUndefined();
    expect(info.match('/users/one')).toBeUndefined();
    expect(info.match('/users/one/two')).toBeUndefined();
    expect(info.match('/users/one/cars/two')).toStrictEqual(m({ userId: 'one', carId: 'two' }));
    expect(info.match('/users/one/cars/two/')).toBeUndefined();
  });
  test('Weird path', () => {
    const info = PathMatcher.parse('/one/two/{three}/four/fi{v_}e/{six6}/{seve}n/eight/n{ine}/');
    expect(info.normalizedPath).toBe('/one/two/{}/four/fi{v_}e/{}/{seve}n/eight/n{ine}/');
    expect(info.pathVars).toStrictEqual(['three', 'six6']);
    expect(info.match('/one/two/three/four/fi{v_}e/six/{seve}n/eight/n{ine}/')).toStrictEqual(
      m({
        three: 'three',
        six6: 'six'
      })
    );
  });
});
