/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IncomingMessage, ServerResponse, createServer } from 'node:http';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { NodeExtractor } from './node-extractor.js';

const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
  const url = new URL(request.url!, 'http://${request.headers.host}');
  extractor = await NodeExtractor.create(request, url, new Map([['p1', 'path']]));
  response.write('hello');
  response.end();
});
let extractor: NodeExtractor;

describe('NodeExtractor tests', () => {
  test('query', async () => {
    await request(server).get('/').query({ q1: 'query' });
    expect(extractor.query('q1')).toBe('query');
    expect(extractor.query('q2')).toBeUndefined();
  });
  test('path', async () => {
    await request(server).get('/');
    expect(extractor.path('p1')).toBe('path');
    expect(extractor.path('p2')).toBeUndefined();
  });
  test('header', async () => {
    await request(server).get('/').set({ h1: 'header' });
    expect(extractor.header('h1')).toBe('header');
    expect(extractor.header('h2')).toBeUndefined();
  });
  test('cookie', async () => {
    await request(server).get('/').set({ Cookie: 'c1=cookie1;c2=cook=ie2' });
    expect(extractor.cookie('c1')).toBe('cookie1');
    expect(extractor.cookie('c2')).toBe('cook=ie2');
    expect(extractor.cookie('c3')).toBeUndefined();
  });
  test('body (string)', async () => {
    await request(server).post('/').send('Hello from Node');
    expect(extractor.bodyText()).toBe('Hello from Node');
  });
  test('body (base64)', async () => {
    await request(server)
      .post('/')
      .set('content-type', 'application/octet-stream')
      .send(Buffer.from('Hello from binary Node'));
    expect(extractor.bodyBuffer()?.toString()).toBe('Hello from binary Node');
  });
});
