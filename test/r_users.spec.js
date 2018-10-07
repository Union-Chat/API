/* eslint-env node, mocha */
import assert from 'assert'
import express from 'express'
import request from 'supertest'
import v2 from '../src/api_v2'

import { migrator, drop } from '../migrations/_migrator'

let server
describe('User Controller', function () {
  let r
  before(() => { r = require('rethinkdbdash')({ db: 'union_test' }) })
  after(() => r.getPoolMaster().drain())
  beforeEach(async function () {
    await migrator()
    const app = express()
    app.use('/', v2)
    await new Promise(resolve => { server = app.listen(6666, resolve) })
  })

  afterEach(async function () {
    await drop()
    await new Promise(resolve => { server = server.close(resolve) })
  })

  describe('Create', function () {
    it('should create an user', async function () {
      const req = await request(server).post('/users/create').send({ username: 'root', password: 'a_secure_password' })
      assert.strictEqual(req.res.statusCode, 204)
      assert.strictEqual(await r.table('users').count().run(), 1)
    })

    it('should reject empty username', async function () {
      const req = await request(server).post('/users/create').send({ username: '', password: 'a_secure_password' })
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('users').count().run(), 0)
    })

    it('should reject too long usernames', async function () {
      const req = await request(server).post('/users/create').send({
        username: 'rooooooooooooooooooooooooooooooooooooooooooooooooooooot',
        password: 'a_secure_password'
      })
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('users').count().run(), 0)
    })

    it('should reject empty password', async function () {
      const req = await request(server).post('/users/create').send({ username: 'root', password: '' })
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('users').count().run(), 0)
    })

    it('should reject short passwords', async function () {
      const r = require('rethinkdbdash')({ db: 'union_test' })
      const req = await request(server).post('/users/create').send({ username: 'root', password: 'lol' })
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('users').count().run(), 0)
      r.getPoolMaster().drain()
    })

    it('should reject already used accounts', async function () {
      const r = require('rethinkdbdash')({ db: 'union_test' })
      const req1 = await request(server).post('/users/create').send({ username: 'root', password: 'a_secure_password' })
      const req2 = await request(server).post('/users/create').send({ username: 'root', password: 'a_secure_password' })
      assert.strictEqual(req1.res.statusCode, 204)
      assert.strictEqual(req2.res.statusCode, 400)
      assert.strictEqual(await r.table('users').count().run(), 1)
      r.getPoolMaster().drain()
    })
  })
})
