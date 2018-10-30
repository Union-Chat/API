/* eslint-env node, mocha */
import './_hooks';

import sinon from 'sinon';
import assert from 'assert';
import mock from 'node-mocks-http';
import { migrator, drop } from '../migrations/_migrator';
import { createUser } from '../src/database';
import authorizeMiddleware from '../src/middlewares/authorize';

describe('Authorize Middleware', () => {
  beforeEach(async () => {
    await migrator();
  });

  afterEach(async () => {
    await drop();
  });

  it('should deny the request if not authenticated', async () => {
    const request = mock.createRequest({ method: 'GET', url: '/' });
    const response = mock.createResponse();
    const callback = sinon.fake();
    await authorizeMiddleware(request, response, callback);

    assert.strictEqual(response.statusCode, 401);
    assert(callback.notCalled);
  });

  it('should deny the request if invalid token', async () => {
    const request = mock.createRequest({ method: 'GET', url: '/', headers: { Authorization: 'Basic lol' } });
    const response = mock.createResponse();
    const callback = sinon.fake();
    await authorizeMiddleware(request, response, callback);

    assert.strictEqual(response.statusCode, 401);
    assert(callback.notCalled);
  });

  it('should allow the request if valid token', async () => {
    const id = await createUser('root', 'a_secure_password');
    const token = Buffer.from(`${id  }:a_secure_password`).toString('base64');

    const request = mock.createRequest({ method: 'GET', url: '/', headers: { Authorization: `Basic ${  token}` } });
    const response = mock.createResponse();
    const callback = sinon.fake();
    await authorizeMiddleware(request, response, callback);

    assert.strictEqual(response.statusCode, 200);
    assert(callback.calledOnce);
  });
});