/* eslint-env node, mocha */
import sinon from 'sinon'
import assert from 'assert'
import mock from 'node-mocks-http'
import { migrator, drop } from '../migrations/_migrator'
import { createServer } from '../src/DatabaseHandler'
import serverExistsMiddleware from '../src/middlewares/serverExists'

describe('Server Exists Middleware', () => {
  beforeEach(async () => {
    await migrator()
  })

  afterEach(async () => {
    await drop()
  })

  it('should return 404 if the server does not exists', async () => {
    let request = mock.createRequest({ method: 'GET', url: '/', params: { serverId: 666 } })
    let response = mock.createResponse()
    let callback = sinon.fake()
    await serverExistsMiddleware(request, response, callback)

    assert.strictEqual(response.statusCode, 404)
    assert(callback.notCalled)
  })

  it('should return 200 if the server exists', async () => {
    await createServer('Union', 'lol.png', 'someone')
    let request = mock.createRequest({ method: 'GET', url: '/', params: { serverId: 1 } })
    let response = mock.createResponse()
    let callback = sinon.fake()
    await serverExistsMiddleware(request, response, callback)

    assert.strictEqual(response.statusCode, 200)
    assert(callback.calledOnce)
  })
})
