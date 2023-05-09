import { describe, expect, test } from 'vitest';
import { RouteMatcher } from './route-matcher.js';

const m = (rec: Record<string, string>) => new Map(Object.entries(rec));

describe('RouteMatcher tests', () => {
  test('No routes', () => {
    const rm = new RouteMatcher<number>();
    expect(rm.match('/')).toBeUndefined();
    expect(rm.match('/users/{userId}')).toBeUndefined();
  });
  test("Single '/' route", () => {
    const rm = new RouteMatcher<number>();
    rm.add('/', 1);
    expect(rm.match('/users/{userId}')).toBeUndefined();
    expect(rm.match('/')).toStrictEqual({
      path: '/',
      pathParameters: m({}),
      value: 1
    });
  });
  test("Single '/users/{userId}' route", () => {
    const rm = new RouteMatcher<number>();
    rm.add('/users/{userId}', 1);

    expect(rm.match('/')).toBeUndefined();
    expect(rm.match('/users/one/')).toBeUndefined();

    expect(rm.match('/users/one')).toStrictEqual({
      path: '/users/{userId}',
      pathParameters: m({ userId: 'one' }),
      value: 1
    });
  });
  test("Many '/users' routes", () => {
    const rm = new RouteMatcher<number>();
    rm.add('/users', 1);
    rm.add('/users/{userId}', 2);
    rm.add('/users/{userId}/cars/{carId}', 3);
    rm.add('/users/create', 4);
    rm.add('/users/update/{userId}', 5);

    expect(rm.match('/')).toBeUndefined();
    expect(rm.match('/users/one/')).toBeUndefined();
    expect(rm.match('/users/one/cars/two/')).toBeUndefined();
    expect(rm.match('/users/create/one')).toBeUndefined();

    expect(rm.match('/users/one')).toStrictEqual({
      path: '/users/{userId}',
      pathParameters: m({ userId: 'one' }),
      value: 2
    });

    expect(rm.match('/users/update')).toStrictEqual({
      path: '/users/{userId}',
      pathParameters: m({ userId: 'update' }),
      value: 2
    });

    expect(rm.match('/users/one/cars/two')).toStrictEqual({
      path: '/users/{userId}/cars/{carId}',
      pathParameters: m({ userId: 'one', carId: 'two' }),
      value: 3
    });

    expect(rm.match('/users/create')).toStrictEqual({
      path: '/users/create',
      pathParameters: m({}),
      value: 4
    });

    expect(rm.match('/users/update/one')).toStrictEqual({
      path: '/users/update/{userId}',
      pathParameters: m({ userId: 'one' }),
      value: 5
    });
  });
});
