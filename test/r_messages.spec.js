/* eslint-env node, mocha */
import './_hooks'

import assert from 'assert'
import express from 'express'
import request from 'supertest'
import v2 from '../src/api_v2'

import { migrator, drop } from '../migrations/_migrator'
import {
  addMemberToServer, createServer, createUser
} from '../src/DatabaseHandler'

let server, r, userId, userToken, serverId
describe('Messages Controller', function () {
  before(() => { r = require('rethinkdbdash')({ silent: true, db: 'union_test' }) })
  after(() => r.getPoolMaster().drain())
  beforeEach(async function () {
    await migrator()
    const app = express()
    app.use('/', v2)

    const username = await createUser('root', 'root')
    const usermeta = username.split('#')
    userId = (await r.table('users').filter({ username: usermeta[0], discriminator: usermeta[1] }).nth(0)).id
    userToken = Buffer.from(username + ':root').toString('base64')

    serverId = (await createServer('A server', 'lol.png', userId)).id
    await addMemberToServer(userId, serverId)

    await new Promise(resolve => { server = app.listen(6666, resolve) })
  })

  afterEach(async function () {
    await drop()
    await new Promise(resolve => { server = server.close(resolve) })
  })

  describe('Post', function () {
    it('should require authentication', async function () {
      const req = await request(server).post('/servers/' + serverId + '/messages')
      assert.strictEqual(req.res.statusCode, 401)
    })

    it('should post a message', async function () {
      const req = await request(server).post('/servers/' + serverId + '/messages').set('Authorization', 'Basic ' + userToken).send({ content: 'Hi' })
      assert.strictEqual(req.res.statusCode, 204)
      assert.strictEqual(await r.table('messages').count().run(), 1)
    })

    it('should reject if the message is empty', async function () {
      const req = await request(server).post('/servers/' + serverId + '/messages').set('Authorization', 'Basic ' + userToken).send({ content: '' })
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('messages').count().run(), 0)
    })

    it('should reject if the message is too long', async function () {
      const req = await request(server).post('/servers/' + serverId + '/messages').set('Authorization', 'Basic ' + userToken).send({ content: 'Hi'.padEnd(1500, 'i') })
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('messages').count().run(), 0)
    })

    it('should reject if the server does not exists', async function () {
      const req = await request(server).post('/servers/666/messages').set('Authorization', 'Basic ' + userToken).send({ content: 'Hi' })
      assert.strictEqual(req.res.statusCode, 404)
    })

    it('should reject if the user is not in the server', async function () {
      const lambdaToken = Buffer.from((await createUser('sudo', 'sudo')) + ':sudo').toString('base64')
      const req = await request(server).post('/servers/' + serverId + '/messages').set('Authorization', 'Basic ' + lambdaToken)
      assert.strictEqual(req.res.statusCode, 403)
      assert.strictEqual(await r.table('invites').count().run(), 0)
    })
  })
})
