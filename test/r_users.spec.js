/* eslint-env node, mocha */
import './_hooks';

import assert from 'assert';
import express from 'express';
import request from 'supertest';
import v2 from '../src/api';

import { migrator, drop } from '../migrations/_migrator';
import { createUser } from '../src/database';

let server;
describe('Users Controller', () => {
  let r;
  before(() => {
    r = require('rethinkdbdash')({ silent: true, db: 'union_test' });
  });
  after(() => r.getPoolMaster().drain());
  beforeEach(async () => {
    await migrator();
    const app = express();
    app.use('/', v2);
    await new Promise(resolve => {
      server = app.listen(6666, resolve);
    });
  });

  afterEach(async () => {
    await drop();
    await new Promise(resolve => {
      server = server.close(resolve);
    });
  });

  describe('Create', () => {
    it('should create an user', async () => {
      const req = await request(server).post('/users').send({ username: 'root', password: 'a_secure_password' });
      assert.strictEqual(req.res.statusCode, 200);
      assert.strictEqual(await r.table('users').count().run(), 1);
    });

    it('should reject empty username', async () => {
      const req = await request(server).post('/users').send({ username: '', password: 'a_secure_password' });
      assert.strictEqual(req.res.statusCode, 400);
      assert.strictEqual(await r.table('users').count().run(), 0);
    });

    it('should reject invalid username', async () => {
      const req1 = await request(server).post('/users').send({
        username: 'ro:ot',
        password: 'a_secure_password'
      });
      const req2 = await request(server).post('/users').send({
        username: 'ro#ot',
        password: 'a_secure_password'
      });
      assert.strictEqual(req1.res.statusCode, 400);
      assert.strictEqual(req2.res.statusCode, 400);
      assert.strictEqual(await r.table('users').count().run(), 0);
    });

    it('should reject too long usernames', async () => {
      const req = await request(server).post('/users').send({
        username: 'rooooooooooooooooooooooooooooooooooooooooooooooooooooot',
        password: 'a_secure_password'
      });
      assert.strictEqual(req.res.statusCode, 400);
      assert.strictEqual(await r.table('users').count().run(), 0);
    });

    it('should reject empty password', async () => {
      const req = await request(server).post('/users').send({ username: 'root', password: '' });
      assert.strictEqual(req.res.statusCode, 400);
      assert.strictEqual(await r.table('users').count().run(), 0);
    });

    it('should reject short passwords', async () => {
      const req = await request(server).post('/users').send({ username: 'root', password: 'lol' });
      assert.strictEqual(req.res.statusCode, 400);
      assert.strictEqual(await r.table('users').count().run(), 0);
    });

    it('should allow duplicate usernames', async () => {
      const req1 = await request(server).post('/users').send({ username: 'root', password: 'a_secure_password' });
      const req2 = await request(server).post('/users').send({ username: 'root', password: 'a_secure_password' });
      assert.strictEqual(req1.res.statusCode, 200);
      assert.strictEqual(req2.res.statusCode, 200);
      assert.strictEqual(await r.table('users').count().run(), 2);
    });
  });

  describe('Self', () => {
    let token;
    beforeEach(async () => {
      token = Buffer.from(`${await createUser('root', 'root')  }:root`).toString('base64');
    });

    describe('Get', () => {
      it('should require authentication', async () => {
        const req = await request(server).get('/users/self');
        assert.strictEqual(req.res.statusCode, 401);
      });
      it('should send current user data', async () => {
        const req = await request(server).get('/users/self').set('Authorization', `Basic ${  token}`);
        const json = JSON.parse(req.res.text);
        assert.strictEqual(req.res.statusCode, 200);
        assert.deepStrictEqual(Object.keys(json).sort(), ['id', 'username', 'discriminator', 'servers', 'online'].sort());
      });
    });

    describe('Update', () => {
      it('should require authentication', async () => {
        const req = await request(server).patch('/users/self');
        assert.strictEqual(req.res.statusCode, 401);
      });

      it('should require authentication (Authorization header)', async () => {
        const req = await request(server).patch('/users/self').send({ password: 'root' });
        assert.strictEqual(req.res.statusCode, 401);
      });

      it('should require extra authentication (Password)', async () => {
        const req = await request(server).patch('/users/self').set('Authorization', `Basic ${  token}`);
        assert.strictEqual(req.res.statusCode, 401);
      });

      it('should reject invalid password', async () => {
        const req = await request(server).patch('/users/self').set('Authorization', `Basic ${  token}`).send({ password: 'lol' });
        assert.strictEqual(req.res.statusCode, 401);
      });

      it('should update the current user', async () => {
        const req = await request(server).patch('/users/self').set('Authorization', `Basic ${  token}`).send({
          username: 'r00t',
          password: 'root',
          newPassword: 'rooooot'
        });
        assert.strictEqual(req.res.statusCode, 200);
      });

      it('should reject empty username', async () => {
        const req = await request(server).patch('/users/self').set('Authorization', `Basic ${  token}`).send({
          username: '',
          password: 'root'
        });
        assert.strictEqual(req.res.statusCode, 400);
      });

      it('should reject invalid username', async () => {
        const req1 = await request(server).patch('/users/self').set('Authorization', `Basic ${  token}`).send({
          username: 'ro:ot',
          password: 'root'
        });
        const req2 = await request(server).patch('/users/self').set('Authorization', `Basic ${  token}`).send({
          username: 'ro#ot',
          password: 'root'
        });
        assert.strictEqual(req1.res.statusCode, 400);
        assert.strictEqual(req2.res.statusCode, 400);
      });

      it('should reject too long usernames', async () => {
        const req = await request(server).patch('/users/self').set('Authorization', `Basic ${  token}`).send({
          username: 'rooooooooooooooooooooooooooooooooooooooooooooooooooooot',
          password: 'root'
        });
        assert.strictEqual(req.res.statusCode, 400);
      });

      it('should reject empty password', async () => {
        const req = await request(server).patch('/users/self').set('Authorization', `Basic ${  token}`).send({
          username: 'r00t',
          password: 'root',
          newPassword: ''
        });
        assert.strictEqual(req.res.statusCode, 400);
      });

      it('should reject short passwords', async () => {
        const req = await request(server).patch('/users/self').set('Authorization', `Basic ${  token}`).send({
          username: 'r00t',
          password: 'root',
          newPassword: 'a'
        });
        assert.strictEqual(req.res.statusCode, 400);
      });
    });

    describe('Delete', () => {
      it('should require authentication', async () => {
        const req = await request(server).delete('/users/self');
        assert.strictEqual(req.res.statusCode, 401);
        assert.strictEqual(await r.table('users').count().run(), 1);
      });

      it('should require authentication (Authorization header)', async () => {
        const req = await request(server).delete('/users/self').send({ password: 'root' });
        assert.strictEqual(req.res.statusCode, 401);
        assert.strictEqual(await r.table('users').count().run(), 1);
      });

      it('should require extra authentication (Password)', async () => {
        const req = await request(server).delete('/users/self').set('Authorization', `Basic ${  token}`);
        assert.strictEqual(req.res.statusCode, 401);
        assert.strictEqual(await r.table('users').count().run(), 1);
      });

      it('should reject invalid password', async () => {
        const req = await request(server).delete('/users/self').set('Authorization', `Basic ${  token}`).send({ password: 'lol' });
        assert.strictEqual(req.res.statusCode, 401);
        assert.strictEqual(await r.table('users').count().run(), 1);
      });

      it('should delete the current user', async () => {
        const req = await request(server).delete('/users/self').set('Authorization', `Basic ${  token}`).send({ password: 'root' });
        assert.strictEqual(req.res.statusCode, 204);
        assert.strictEqual(await r.table('users').count().run(), 0);
      });
    });
  });
});
