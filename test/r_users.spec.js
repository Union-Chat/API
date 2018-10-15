/* eslint-env node, mocha */
import './_hooks'

import assert from 'assert'
import express from 'express'
import request from 'supertest'
import v2 from '../src/api'

import { migrator, drop } from '../migrations/_migrator'
import { createUser } from '../src/DatabaseHandler'

let server
describe('Users Controller', function () {
  let r
  before(() => { r = require('rethinkdbdash')({ silent: true, db: 'union_test' }) })
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
      const req = await request(server).post('/users').send({ username: 'root', password: 'a_secure_password' })
      assert.strictEqual(req.res.statusCode, 200)
      assert.strictEqual(await r.table('users').count().run(), 1)
    })

    it('should reject empty username', async function () {
      const req = await request(server).post('/users').send({ username: '', password: 'a_secure_password' })
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('users').count().run(), 0)
    })

    it('should reject invalid username', async function () {
      const req1 = await request(server).post('/users').send({
        username: 'ro:ot',
        password: 'a_secure_password'
      })
      const req2 = await request(server).post('/users').send({
        username: 'ro#ot',
        password: 'a_secure_password'
      })
      assert.strictEqual(req1.res.statusCode, 400)
      assert.strictEqual(req2.res.statusCode, 400)
      assert.strictEqual(await r.table('users').count().run(), 0)
    })

    it('should reject too long usernames', async function () {
      const req = await request(server).post('/users').send({
        username: 'rooooooooooooooooooooooooooooooooooooooooooooooooooooot',
        password: 'a_secure_password'
      })
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('users').count().run(), 0)
    })

    it('should reject empty password', async function () {
      const req = await request(server).post('/users').send({ username: 'root', password: '' })
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('users').count().run(), 0)
    })

    it('should reject short passwords', async function () {
      const req = await request(server).post('/users').send({ username: 'root', password: 'lol' })
      assert.strictEqual(req.res.statusCode, 400)
      assert.strictEqual(await r.table('users').count().run(), 0)
    })

    it('should allow duplicate usernames', async function () {
      const req1 = await request(server).post('/users').send({ username: 'root', password: 'a_secure_password' })
      const req2 = await request(server).post('/users').send({ username: 'root', password: 'a_secure_password' })
      assert.strictEqual(req1.res.statusCode, 200)
      assert.strictEqual(req2.res.statusCode, 200)
      assert.strictEqual(await r.table('users').count().run(), 2)
    })
  })

  describe('Self', function () {
    let token
    beforeEach(async function () {
      token = Buffer.from((await createUser('root', 'root')) + ':root').toString('base64')
    })

    describe('Get', function () {
      it('should require authentication', async function () {
        const req = await request(server).get('/users/self')
        assert.strictEqual(req.res.statusCode, 401)
      })
      it('should send current user data', async function () {
        const req = await request(server).get('/users/self').set('Authorization', 'Basic ' + token)
        const json = JSON.parse(req.res.text)
        assert.strictEqual(req.res.statusCode, 200)
        assert.deepStrictEqual(Object.keys(json).sort(), ['id', 'username', 'discriminator', 'createdAt', 'servers', 'online'].sort())
      })
    })

    describe('Update', function () {
      it('should require authentication', async function () {
        const req = await request(server).patch('/users/self')
        assert.strictEqual(req.res.statusCode, 401)
      })

      it('should require authentication (Authorization header)', async function () {
        const req = await request(server).patch('/users/self').send({ password: 'root' })
        assert.strictEqual(req.res.statusCode, 401)
      })

      it('should require extra authentication (Password)', async function () {
        const req = await request(server).patch('/users/self').set('Authorization', 'Basic ' + token)
        assert.strictEqual(req.res.statusCode, 401)
      })

      it('should reject invalid password', async function () {
        const req = await request(server).patch('/users/self').set('Authorization', 'Basic ' + token).send({ password: 'lol' })
        assert.strictEqual(req.res.statusCode, 401)
      })

      it('should update the current user', async function () {
        const req = await request(server).patch('/users/self').set('Authorization', 'Basic ' + token).send({
          username: 'r00t',
          password: 'root',
          newPassword: 'rooooot'
        })
        assert.strictEqual(req.res.statusCode, 200)
      })

      it('should reject empty username', async function () {
        const req = await request(server).patch('/users/self').set('Authorization', 'Basic ' + token).send({
          username: '',
          password: 'root'
        })
        assert.strictEqual(req.res.statusCode, 400)
      })

      it('should reject invalid username', async function () {
        const req1 = await request(server).patch('/users/self').set('Authorization', 'Basic ' + token).send({
          username: 'ro:ot',
          password: 'root'
        })
        const req2 = await request(server).patch('/users/self').set('Authorization', 'Basic ' + token).send({
          username: 'ro#ot',
          password: 'root'
        })
        assert.strictEqual(req1.res.statusCode, 400)
        assert.strictEqual(req2.res.statusCode, 400)
      })

      it('should reject too long usernames', async function () {
        const req = await request(server).patch('/users/self').set('Authorization', 'Basic ' + token).send({
          username: 'rooooooooooooooooooooooooooooooooooooooooooooooooooooot',
          password: 'root'
        })
        assert.strictEqual(req.res.statusCode, 400)
      })

      it('should reject empty password', async function () {
        const req = await request(server).patch('/users/self').set('Authorization', 'Basic ' + token).send({
          username: 'r00t',
          password: 'root',
          newPassword: ''
        })
        assert.strictEqual(req.res.statusCode, 400)
      })

      it('should reject short passwords', async function () {
        const req = await request(server).patch('/users/self').set('Authorization', 'Basic ' + token).send({
          username: 'r00t',
          password: 'root',
          newPassword: 'a'
        })
        assert.strictEqual(req.res.statusCode, 400)
      })
    })

    describe('Delete', function () {
      it('should require authentication', async function () {
        const req = await request(server).delete('/users/self')
        assert.strictEqual(req.res.statusCode, 401)
        assert.strictEqual(await r.table('users').count().run(), 1)
      })

      it('should require authentication (Authorization header)', async function () {
        const req = await request(server).delete('/users/self').send({ password: 'root' })
        assert.strictEqual(req.res.statusCode, 401)
        assert.strictEqual(await r.table('users').count().run(), 1)
      })

      it('should require extra authentication (Password)', async function () {
        const req = await request(server).delete('/users/self').set('Authorization', 'Basic ' + token)
        assert.strictEqual(req.res.statusCode, 401)
        assert.strictEqual(await r.table('users').count().run(), 1)
      })

      it('should reject invalid password', async function () {
        const req = await request(server).delete('/users/self').set('Authorization', 'Basic ' + token).send({ password: 'lol' })
        assert.strictEqual(req.res.statusCode, 401)
        assert.strictEqual(await r.table('users').count().run(), 1)
      })

      it('should delete the current user', async function () {
        const req = await request(server).delete('/users/self').set('Authorization', 'Basic ' + token).send({ password: 'root' })
        assert.strictEqual(req.res.statusCode, 204)
        assert.strictEqual(await r.table('users').count().run(), 0)
      })
    })
  })
})
