/* eslint-env node, mocha */
import './_hooks'

import assert from 'assert'
import express from 'express'
import request from 'supertest'
import v2 from '../src/api'

import { migrator, drop } from '../migrations/_migrator'
import {
  addMemberToServer, createServer, createUser, generateInvite, isInServer
} from '../src/database'

let server, r, userId, userToken, lambdaId, lambdaToken, serverId
describe('Invites Controller', function () {
  before(() => { r = require('rethinkdbdash')({ silent: true, db: 'union_test' }) })
  after(() => r.getPoolMaster().drain())
  beforeEach(async function () {
    await migrator()
    const app = express()
    app.use('/', v2)

    let username = await createUser('root', 'root')
    let usermeta = username.split('#')
    userId = (await r.table('users').filter({ username: usermeta[0], discriminator: usermeta[1] }).nth(0)).id
    userToken = Buffer.from(username + ':root').toString('base64')

    username = await createUser('sudo', 'sudo')
    usermeta = username.split('#')
    lambdaId = (await r.table('users').filter({ username: usermeta[0], discriminator: usermeta[1] }).nth(0)).id
    lambdaToken = Buffer.from(username + ':sudo').toString('base64')

    serverId = (await createServer('A server', 'lol.png', userId)).id
    await addMemberToServer(userId, serverId)

    await new Promise(resolve => { server = app.listen(6666, resolve) })
  })

  afterEach(async function () {
    await drop()
    await new Promise(resolve => { server = server.close(resolve) })
  })

  describe('Create', function () {
    it('should require authentication', async function () {
      const req = await request(server).post('/servers/' + serverId + '/invites')
      assert.strictEqual(req.res.statusCode, 401)
    })

    it('should create an invite', async function () {
      const req = await request(server).post('/servers/' + serverId + '/invites').set('Authorization', 'Basic ' + userToken)
      assert.strictEqual(req.res.statusCode, 200)
      assert.strictEqual(await r.table('invites').count().run(), 1)
    })

    it('should reject if the server does not exists', async function () {
      const req = await request(server).post('/servers/666/invites').set('Authorization', 'Basic ' + userToken)
      assert.strictEqual(req.res.statusCode, 404)
    })

    it('should reject if the user is not the server owner', async function () {
      const req = await request(server).post('/servers/' + serverId + '/invites').set('Authorization', 'Basic ' + lambdaToken)
      assert.strictEqual(req.res.statusCode, 403)
      assert.strictEqual(await r.table('invites').count().run(), 0)
    })
  })

  describe('Accept', function () {
    let invite
    beforeEach(async function () {
      invite = await generateInvite(serverId, userId)
    })

    it('should require authentication', async function () {
      const req = await request(server).post('/invites/' + invite)
      assert.strictEqual(req.res.statusCode, 401)
    })

    it('should join the server', async function () {
      const req = await request(server).post('/invites/' + invite).set('Authorization', 'Basic ' + lambdaToken)
      assert.strictEqual(req.res.statusCode, 204)
      assert.strictEqual(await isInServer(lambdaId, serverId), true)
    })

    it('should reject if the invite does not exists', async function () {
      const req = await request(server).post('/invites/join_this_server_pls').set('Authorization', 'Basic ' + lambdaToken)
      assert.strictEqual(req.res.statusCode, 404)
    })

    it('should reject if the user is already in the server', async function () {
      const req = await request(server).post('/invites/' + invite).set('Authorization', 'Basic ' + userToken)
      assert.strictEqual(req.res.statusCode, 400)
    })
  })
})
