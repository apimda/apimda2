import { describe, expect, test } from '@jest/globals';
import { LambdaExtractor } from './lambda-extractor';

const sampleEvent = {
  version: '2.0',
  routeKey: '$default',
  rawPath: '/my/path',
  rawQueryString: 'parameter1=value1&parameter1=value2&parameter2=value',
  cookies: ['cookie1=value1', 'cookie2=val=ue2'],
  headers: {
    header1: 'value1',
    header2: 'value1,value2'
  },
  queryStringParameters: {
    parameter1: 'value1,value2',
    parameter2: 'value'
  },
  requestContext: {
    accountId: '123456789012',
    apiId: 'api-id',
    authentication: {
      clientCert: {
        clientCertPem: 'CERT_CONTENT',
        subjectDN: 'www.example.com',
        issuerDN: 'Example issuer',
        serialNumber: 'a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1',
        validity: {
          notBefore: 'May 28 12:30:02 2019 GMT',
          notAfter: 'Aug  5 09:36:04 2021 GMT'
        }
      }
    },
    authorizer: {
      jwt: {
        claims: {
          claim1: 'value1',
          claim2: 'value2'
        },
        scopes: ['scope1', 'scope2']
      }
    },
    domainName: 'id.execute-api.us-east-1.amazonaws.com',
    domainPrefix: 'id',
    http: {
      method: 'POST',
      path: '/my/path',
      protocol: 'HTTP/1.1',
      sourceIp: 'IP',
      userAgent: 'agent'
    },
    requestId: 'id',
    routeKey: '$default',
    stage: '$default',
    time: '12/Mar/2020:19:03:58 +0000',
    timeEpoch: 1583348638390
  },
  body: 'Hello from Lambda',
  pathParameters: {
    parameter1: 'value1'
  },
  isBase64Encoded: false,
  stageVariables: {
    stageVariable1: 'value1',
    stageVariable2: 'value2'
  }
};

const base64Event = {
  ...sampleEvent,
  isBase64Encoded: true,
  body: 'SGVsbG8gZnJvbSBiaW5hcnkgTGFtYmRh'
};

const extractor = new LambdaExtractor(sampleEvent);

describe('LambdaExtractor tests', () => {
  test('query', () => {
    expect(extractor.query('parameter1')).toBe('value1,value2');
    expect(extractor.query('parameter2')).toBe('value');
    expect(extractor.query('parameter3')).toBeUndefined();
  });

  test('path', () => {
    expect(extractor.path('parameter1')).toBe('value1');
    expect(extractor.path('parameter2')).toBeUndefined();
  });

  test('header', () => {
    expect(extractor.header('header1')).toBe('value1');
    expect(extractor.header('header2')).toBe('value1,value2');
    expect(extractor.header('header3')).toBeUndefined();
  });

  test('cookie', () => {
    expect(extractor.cookie('cookie1')).toBe('value1');
    expect(extractor.cookie('cookie2')).toBe('val=ue2');
    expect(extractor.cookie('cookie3')).toBeUndefined();
  });

  test('body (string)', () => {
    expect(extractor.bodyText()).toBe('Hello from Lambda');
  });

  test('body (base64)', () => {
    const binExt = new LambdaExtractor(base64Event);
    const buffer = binExt.bodyBuffer();
    expect(buffer?.toString()).toBe('Hello from binary Lambda');
  });
});
