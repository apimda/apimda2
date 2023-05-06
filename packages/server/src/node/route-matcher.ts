import { PathMatcher } from '@apimda/core';

interface RouteMatch<T> {
  path: string;
  pathParameters: Map<string, string>;
  value: T;
}

interface RoutePath<T> {
  pathMatcher: PathMatcher;
  value: T;
}

export class RouteMatcher<T> {
  public routePaths: RoutePath<T>[] = [];

  add(routePath: string, value: T) {
    this.routePaths.push({ pathMatcher: PathMatcher.parse(routePath), value });
    this.routePaths.sort((pathA, pathB) => {
      const a = pathA.pathMatcher.normalizedPath;
      const b = pathB.pathMatcher.normalizedPath;
      return a > b ? 1 : a < b ? -1 : 0;
    });
  }

  match(requestPath: string): RouteMatch<T> | undefined {
    for (const routePath of this.routePaths) {
      const pathParameters = routePath.pathMatcher.match(requestPath);
      if (pathParameters) {
        return {
          path: routePath.pathMatcher.path,
          pathParameters,
          value: routePath.value
        };
      }
    }
    return undefined;
  }
}
