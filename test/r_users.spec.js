/* eslint-env node, mocha */
import assert from 'assert'
import express from 'express'
import request from 'supertest'
import v2 from '../src/controllers/v2'

import { migrator, drop } from '../migrations/_migrator'

let server
describe('User Controller', () => {
  beforeEach(async () => {
    await migrator()
    const app = express()
    app.use('/', v2)
    server = app.listen(6666)
  })

  afterEach((done) => {
    drop().then(() => server.close(done))
  })

  describe('Create', () => {
    it('should create an user', async () => {
      const req = await request(server).post('/users/create').send({ username: 'root', password: 'a_secure_password' })
      assert.strictEqual(req.res.statusCode, 204)
    })

    it('should reject empty username')
    it('should reject too long usernames')
    it('should reject empty password')
    it('should reject short passwords')
    it('should reject already used accounts')
  })
})
