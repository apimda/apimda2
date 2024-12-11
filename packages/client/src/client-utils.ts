import { AnyInputDef, AnyOperationDef, BodyBinaryParamDef, BodyTextParamDef, ParamLocation } from '@apimda/core';

export type ParamValue = number | boolean | string | object | Blob | null | undefined;

export function buildPath(pathTemplate: string, pathVars: Record<string, string>) {
  return pathTemplate.replace(/\{(\w+)\}/gi, (match, pathVarName) => {
    const pathValue = pathVars[pathVarName];
    if (!pathValue) {
      throw new Error(`Could not resolve path variable:'${pathVarName}'`);
    }
    return encodeURIComponent(pathValue);
  });
}

export function buildQuery(queryVars: Record<string, string>) {
  const value = Object.entries(queryVars)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return value ? `?${value}` : '';
}

export function buildUrl(
  endpoint: string,
  pathTemplate: string,
  pathVars: Record<string, string>,
  queryVars: Record<string, string>
) {
  const path = buildPath(pathTemplate, pathVars);
  const query = buildQuery(queryVars);
  return `${endpoint}${path}${query}`;
}

export function encodeCookies(cookies: Record<string, string>) {
  const value = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join(';');
  return value.length ? value : undefined;
}

export function buildHeaders(headers: Record<string, string>, cookies: Record<string, string>, bodyType: BodyType) {
  const encodedCookies = encodeCookies(cookies);
  if (encodedCookies) {
    headers['Cookie'] = encodedCookies;
  }
  if (bodyType) {
    headers['Content-Type'] = bodyType;
  }
  return headers;
}

export type HeadParamLocation = Exclude<ParamLocation, 'body' | 'body-text' | 'body-binary'>;
export type StringifiedParamValue = number | boolean | string | bigint | object;

export function paramStringValue(value: StringifiedParamValue) {
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'bigint') {
    return value.toString();
  }
  return JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
}

export type BodyType = 'application/octet-stream' | 'application/json' | 'text/plain' | undefined;

export function paramsByLocation(definition: AnyInputDef, input: Record<string, ParamValue>) {
  const params: Record<Exclude<ParamLocation, 'body'>, Record<string, string>> = {
    cookie: {},
    header: {},
    path: {},
    query: {}
  };
  let body: undefined | string | Blob = undefined;
  let bodyType: BodyType = undefined;
  for (const propertyName in definition) {
    const rawValue = input[propertyName];
    if (rawValue === undefined || rawValue === null) {
      continue;
    }
    const param = definition[propertyName];
    if (param.location === 'body') {
      body = param instanceof BodyBinaryParamDef ? (rawValue as Blob) : paramStringValue(rawValue);
      bodyType =
        param instanceof BodyBinaryParamDef
          ? 'application/octet-stream'
          : param instanceof BodyTextParamDef
            ? 'text/plain'
            : 'application/json';
    } else {
      const paramValue = paramStringValue(rawValue as StringifiedParamValue);
      const paramName = param.name ?? propertyName;
      params[param.location][paramName] = paramValue;
    }
  }
  return { params, body, bodyType };
}

export function getHttpMethod(def: AnyOperationDef) {
  return def.method.toUpperCase();
}
