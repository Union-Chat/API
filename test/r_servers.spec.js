/* eslint-env node, mocha */
import './_hooks'

import assert from 'assert'
import express from 'express'
import request from 'supertest'
import v2 from '../src/api'

import { migrator, drop } from '../migrations/_migrator'
import {
  addMemberToServer, createServer, createUser, getServer, isInServer,
  removeMemberFromServer
} from '../src/DatabaseHandler'

let server, r, userId, token
describe('Servers Controller', function () {
  before(() => { r = require('rethinkdbdash')({ silent: true, db: 'union_test' }) })
  after(() => r.getPoolMaster().drain())
  beforeEach(async function () {
    await migrator()
    const app = express()
    app.use('/', v2)

    const username = await createUser('root', 'root')
    const usermeta = username.split('#')
    userId = (await r.table('users').filter({ username: usermeta[0], discriminator: usermeta[1] }).nth(0)).id
    token = Buffer.from(username + ':root').toString('base64')

    await new Promise(resolve => { server = app.listen(6666, resolve) })
  })

  afterEach(async function () {
    await drop()
    await new Promise(resolve => { server = server.close(resolve) })
  })

  describe('Create', function () {
    it('should require authentication', async function () {
      const req = await request(server).post('/servers')
      assert.strictEqual(req.res.statusCode, 401)
    })

    it('should create a server with correct owner id', async function () {
      const req = await request(server).post('/servers').send({
        name: 'A server',
        iconUrl: 'lol.png'
      }).set('Authorization', 'Basic ' + token)
      assert.strictEqual(req.res.statusCode, 204)
      assert.strictEqual(await r.table('servers').count().run(), 1)
      const serv = await getServer(1)
      assert.strictEqual(serv.owner, userId)
    })

    it('should reject empty name', async function () {
      const req = await request(server).post('/servers').send({
        name: '',
        iconUrl: 'lol.png'
      }).set('Authorization', 'Basic ' + token)
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('servers').count().run(), 0)
    })

    it('should reject too long names', async function () {
      const req = await request(server).post('/servers').send({
        name: 'A serverrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
        iconUrl: 'lol.png'
      }).set('Authorization', 'Basic ' + token)
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('servers').count().run(), 0)
    })

    it('should prevent user from creating ton of servers', async function () {
      const serverData = { name: 'A server', iconUrl: 'lol.png' }
      await request(server).post('/servers').send(serverData).set('Authorization', 'Basic ' + token)
      await request(server).post('/servers').send(serverData).set('Authorization', 'Basic ' + token)
      await request(server).post('/servers').send(serverData).set('Authorization', 'Basic ' + token)
      await request(server).post('/servers').send(serverData).set('Authorization', 'Basic ' + token)
      await request(server).post('/servers').send(serverData).set('Authorization', 'Basic ' + token)
      const req = await request(server).post('/servers').send(serverData).set('Authorization', 'Basic ' + token)

      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('servers').count().run(), 5)
    })
  })

  describe('Update', function () {
    let serverId, lambdaToken
    beforeEach(async function () {
      const username = await createUser('sudo', 'sudo')
      const usermeta = username.split('#')
      lambdaToken = Buffer.from(username + ':sudo').toString('base64')
      const lambdaId = (await r.table('users').filter({ username: usermeta[0], discriminator: usermeta[1] }).nth(0)).id
      serverId = (await createServer('A server', 'lol.png', userId)).id
      await addMemberToServer(lambdaId, serverId)
    })

    it('should require authentication', async function () {
      const req = await request(server).patch('/servers/' + serverId)
      assert.strictEqual(req.res.statusCode, 401)
    })

    it('should reject if the server does not exists', async function () {
      const req = await request(server).patch('/servers/666').set('Authorization', 'Basic ' + token)
      assert.strictEqual(req.res.statusCode, 404)
    })

    it('should reject if the user is the server owner', async function () {
      const req = await request(server).patch('/servers/' + serverId).set('Authorization', 'Basic ' + lambdaToken)
      assert.strictEqual(req.res.statusCode, 403)
    })

    it('should update the server', async function () {
      const req = await request(server).patch('/servers/' + serverId).send({
        name: 'A new name',
        iconUrl: 'a_new_icon.png'
      }).set('Authorization', 'Basic ' + token)
      assert.strictEqual(req.res.statusCode, 204)
    })

    it('should reject empty name', async function () {
      const req = await request(server).patch('/servers/' + serverId).send({
        name: ''
      }).set('Authorization', 'Basic ' + token)
      assert.strictEqual(req.res.statusCode, 400)
    })

    it('should reject too long names', async function () {
      const req = await request(server).patch('/servers/' + serverId).send({
        name: 'A serverrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr'
      }).set('Authorization', 'Basic ' + token)
      assert.strictEqual(req.res.statusCode, 400)
    })
  })

  describe('Leave', function () {
    let serverId, lambdaId, lambdaToken
    beforeEach(async function () {
      const username = await createUser('sudo', 'sudo')
      const usermeta = username.split('#')
      lambdaId = (await r.table('users').filter({ username: usermeta[0], discriminator: usermeta[1] }).nth(0)).id
      lambdaToken = Buffer.from(username + ':sudo').toString('base64')

      serverId = (await createServer('A server', 'lol.png', userId)).id
      await addMemberToServer(lambdaId, serverId)
    })

    it('should require authentication', async function () {
      const req = await request(server).delete('/servers/' + serverId + '/leave')
      assert.strictEqual(req.res.statusCode, 401)
    })

    it('should leave the server', async function () {
      const req = await request(server).delete('/servers/' + serverId + '/leave').set('Authorization', 'Basic ' + lambdaToken)
      assert.strictEqual(req.res.statusCode, 204)
      assert.strictEqual(await isInServer(lambdaId, serverId), false)
    })

    it('should reject if the server does not exists', async function () {
      const req = await request(server).delete('/servers/666/leave').set('Authorization', 'Basic ' + lambdaToken)
      assert.strictEqual(req.res.statusCode, 404)
    })

    it('should reject if the user is the server owner', async function () {
      const req = await request(server).delete('/servers/' + serverId + '/leave').set('Authorization', 'Basic ' + token)
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await isInServer(lambdaId, serverId), true)
    })

    it('should reject if the user is not in this server', async function () {
      await removeMemberFromServer(lambdaId, serverId)
      const req = await request(server).delete('/servers/' + serverId + '/leave').set('Authorization', 'Basic ' + lambdaToken)
      assert.strictEqual(req.res.statusCode, 400)
    })
  })

  describe('Delete', function () {
    let serverId, lambdaId, lambdaToken
    beforeEach(async function () {
      const username = await createUser('sudo', 'sudo')
      const usermeta = username.split('#')
      lambdaId = (await r.table('users').filter({ username: usermeta[0], discriminator: usermeta[1] }).nth(0)).id
      lambdaToken = Buffer.from(username + ':sudo').toString('base64')

      serverId = (await createServer('A server', 'lol.png', userId)).id
      await addMemberToServer(lambdaId, serverId)
    })

    it('should require authentication', async function () {
      const req = await request(server).delete('/servers/' + serverId)
      assert.strictEqual(req.res.statusCode, 401)
    })

    it('should delete the server', async function () {
      const req = await request(server).delete('/servers/' + serverId).set('Authorization', 'Basic ' + token)
      assert.strictEqual(req.res.statusCode, 204)
      assert.strictEqual(await r.table('servers').count().run(), 0)
    })

    it('should reject if the server does not exists', async function () {
      const req = await request(server).delete('/servers/666').set('Authorization', 'Basic ' + token)
      assert.strictEqual(req.res.statusCode, 404)
      assert.strictEqual(await r.table('servers').count().run(), 1)
    })

    it('should reject if the user is not the server owner', async function () {
      const req = await request(server).delete('/servers/' + serverId).set('Authorization', 'Basic ' + lambdaToken)
      assert.strictEqual(req.res.statusCode, 403)
      assert.strictEqual(await r.table('servers').count().run(), 1)
    })
  })
})
