/* eslint-env node, mocha */
import './_hooks';

import assert from 'assert';
import express from 'express';
import request from 'supertest';
import v2 from '../src/api';

let server;
describe('Core Controller', () => {
  beforeEach(async () => {
    const app = express();
    app.use('/', v2);
    server = app.listen(6666);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should send the welcome message', async () => {
    const req = await request(server).get('/');
    assert.strictEqual(req.res.text, 'Welcome to the Union API!');
    assert.strictEqual(req.res.statusCode, 200);
  });

  it('should send API configuration', async () => {
    const req = await request(server).get('/info');
    const json = JSON.parse(req.res.text);
    assert.strictEqual(req.res.statusCode, 200);
    assert.strictEqual(json.apiVersion, 2);
  });
});
