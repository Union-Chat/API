/* eslint-env node, mocha */
import assert from 'assert'
import express from 'express'
import request from 'supertest'
import v2 from '../src/api_v2'

let server
describe('Core Controller', function () {
  beforeEach(async function () {
    const app = express()
    app.use('/', v2)
    server = app.listen(6666)
  })

  afterEach((done) => {
    server.close(done)
  })

  it('should send the welcome message', async function () {
    const req = await request(server).get('/')
    assert.strictEqual(req.res.text, 'Welcome to the Union API!')
    assert.strictEqual(req.res.statusCode, 200)
  })

  it('should send API configuration', async function () {
    const req = await request(server).get('/info')
    const json = JSON.parse(req.res.text)
    assert.strictEqual(req.res.statusCode, 200)
    assert.strictEqual(json.apiVersion, 2)
  })
})
