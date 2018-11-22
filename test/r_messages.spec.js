/* eslint-env node, mocha */
import './_hooks';

import assert from 'assert';
import express from 'express';
import request from 'supertest';
import v2 from '../src/api';

import { migrator, drop } from '../migrations/_migrator';
import {
  addMemberToServer, createServer, createUser, removeMemberFromServer, storeMessage
} from '../src/database';

let server, r, userId, userToken, serverId;
describe('Messages Controller', () => {
  before(() => {
    r = require('rethinkdbdash')({ silent: true, db: 'union_test' });
  });
  after(() => r.getPoolMaster().drain());
  beforeEach(async () => {
    await migrator();
    const app = express();
    app.use('/', v2);

    const username = await createUser('root', 'root');
    const usermeta = username.split('#');
    userId = (await r.table('users').filter({ username: usermeta[0], discriminator: usermeta[1] }).nth(0)).id;
    userToken = Buffer.from(`${username  }:root`).toString('base64');

    serverId = (await createServer('A server', 'lol.png', userId)).id;
    await addMemberToServer(userId, serverId);

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

  describe('Post', () => {
    it('should require authentication', async () => {
      const req = await request(server).post(`/servers/${  serverId  }/messages`);
      assert.strictEqual(req.res.statusCode, 401);
    });

    it('should post a message', async () => {
      const req = await request(server).post(`/servers/${  serverId  }/messages`).set('Authorization', `Basic ${  userToken}`).send({ content: 'Hi' });
      assert.strictEqual(req.res.statusCode, 204);
      assert.strictEqual(await r.table('messages').count().run(), 1);
    });

    it('should reject if the message is empty', async () => {
      const req = await request(server).post(`/servers/${  serverId  }/messages`).set('Authorization', `Basic ${  userToken}`).send({ content: '' });
      assert.strictEqual(req.res.statusCode, 400);
      assert.strictEqual(await r.table('messages').count().run(), 0);
    });

    it('should reject if the message is too long', async () => {
      const req = await request(server).post(`/servers/${  serverId  }/messages`).set('Authorization', `Basic ${  userToken}`).send({ content: 'Hi'.padEnd(3500, 'i') });
      assert.strictEqual(req.res.statusCode, 400);
      assert.strictEqual(await r.table('messages').count().run(), 0);
    });

    it('should reject if the server does not exists', async () => {
      const req = await request(server).post('/servers/666/messages').set('Authorization', `Basic ${  userToken}`).send({ content: 'Hi' });
      assert.strictEqual(req.res.statusCode, 404);
    });

    it('should reject if the user is not in the server', async () => {
      const lambdaToken = Buffer.from(`${await createUser('sudo', 'sudo')  }:sudo`).toString('base64');
      const req = await request(server).post(`/servers/${  serverId  }/messages`).set('Authorization', `Basic ${  lambdaToken}`);
      assert.strictEqual(req.res.statusCode, 403);
      assert.strictEqual(await r.table('invites').count().run(), 0);
    });
  });

  describe('Update', () => {
    let lambdaId, lambdaToken;
    beforeEach(async () => {
      const username = await createUser('sudo', 'sudo');
      const usermeta = username.split('#');
      lambdaToken = Buffer.from(`${username  }:sudo`).toString('base64');
      lambdaId = (await r.table('users').filter({ username: usermeta[0], discriminator: usermeta[1] }).nth(0)).id;
      await storeMessage('uwu', lambdaId, serverId, '@Devoxin#0101 u gay');
      await addMemberToServer(lambdaId, serverId);
    });

    it('should require authentication', async () => {
      const req = await request(server).patch(`/servers/${  serverId  }/messages/uwu`);
      assert.strictEqual(req.res.statusCode, 401);
    });

    it('should update the message', async () => {
      const req = await request(server).patch(`/servers/${  serverId  }/messages/uwu`).set('Authorization', `Basic ${  lambdaToken}`).send({ content: '.' });
      assert.strictEqual(req.res.statusCode, 204);
    });

    it('should reject if the server does not exists', async () => {
      const req = await request(server).patch('/servers/666/messages/uwu').set('Authorization', `Basic ${  lambdaToken}`).send({ content: '.' });
      assert.strictEqual(req.res.statusCode, 404);
    });

    it('should reject if the message does not exists', async () => {
      const req = await request(server).patch(`/servers/${  serverId  }/messages/owo`).set('Authorization', `Basic ${  lambdaToken}`).send({ content: '.' });
      assert.strictEqual(req.res.statusCode, 404);
    });

    it('should reject if the message and the server does not match', async () => {
      const newServerId = (await createServer('A server', 'lol.png', userId)).id;
      const req = await request(server).patch(`/servers/${  newServerId  }/messages/uwu`).set('Authorization', `Basic ${  lambdaToken}`).send({ content: '.' });
      assert.strictEqual(req.res.statusCode, 404);
    });

    it('should reject if the user is not the author', async () => {
      const req = await request(server).patch(`/servers/${  serverId  }/messages/uwu`).set('Authorization', `Basic ${  userToken}`).send({ content: '.' });
      assert.strictEqual(req.res.statusCode, 403);
    });

    it('should reject if the user is not in the server anymore', async () => {
      await removeMemberFromServer(lambdaId, serverId);
      const req = await request(server).patch(`/servers/${  serverId  }/messages/uwu`).set('Authorization', `Basic ${  lambdaToken}`).send({ content: '.' });
      assert.strictEqual(req.res.statusCode, 403);
    });

    it('should reject if the message is empty', async () => {
      const req = await request(server).patch(`/servers/${  serverId  }/messages/uwu`).set('Authorization', `Basic ${  lambdaToken}`).send({ content: '' });
      assert.strictEqual(req.res.statusCode, 400);
    });

    it('should reject if the message is too long', async () => {
      const req = await request(server).patch(`/servers/${  serverId  }/messages/uwu`).set('Authorization', `Basic ${  lambdaToken}`).send({ content: '.'.padEnd(3500, '.') });
      assert.strictEqual(req.res.statusCode, 400);
    });
  });

  describe('Delete', () => {
    let lambdaId, lambdaToken;
    beforeEach(async () => {
      const username = await createUser('sudo', 'sudo');
      const usermeta = username.split('#');
      lambdaToken = Buffer.from(`${username  }:sudo`).toString('base64');
      lambdaId = (await r.table('users').filter({ username: usermeta[0], discriminator: usermeta[1] }).nth(0)).id;
      await storeMessage('uwu', lambdaId, serverId, '@Devoxin#0101 u gay');
      await addMemberToServer(lambdaId, serverId);
    });

    it('should require authentication', async () => {
      const req = await request(server).delete(`/servers/${  serverId  }/messages/uwu`);
      assert.strictEqual(req.res.statusCode, 401);
    });

    it('should delete the message (author)', async () => {
      const req = await request(server).delete(`/servers/${  serverId  }/messages/uwu`).set('Authorization', `Basic ${  lambdaToken}`);
      assert.strictEqual(req.res.statusCode, 204);
      assert.strictEqual(await r.table('messages').count().run(), 0);
    });

    it('should delete the message (server owner)', async () => {
      const req = await request(server).delete(`/servers/${  serverId  }/messages/uwu`).set('Authorization', `Basic ${  userToken}`);
      assert.strictEqual(req.res.statusCode, 204);
      assert.strictEqual(await r.table('messages').count().run(), 0);
    });

    it('should reject if the server does not exists', async () => {
      const req = await request(server).delete('/servers/666/messages/uwu').set('Authorization', `Basic ${  userToken}`);
      assert.strictEqual(req.res.statusCode, 404);
    });

    it('should reject if the message does not exists', async () => {
      const req = await request(server).delete(`/servers/${  serverId  }/messages/owo`).set('Authorization', `Basic ${  userToken}`);
      assert.strictEqual(req.res.statusCode, 404);
    });

    it('should reject if the user is not the author nor the owner', async () => {
      const veryLambdaToken = Buffer.from(`${await createUser('do you know medal?', 'do you know medal?')  }:do you know medal?`).toString('base64');
      const req = await request(server).delete(`/servers/${  serverId  }/messages/uwu`).set('Authorization', `Basic ${  veryLambdaToken}`);
      assert.strictEqual(req.res.statusCode, 403);
      assert.strictEqual(await r.table('messages').count().run(), 1);
    });

    it('should reject if the user is not in the server anymore', async () => {
      await removeMemberFromServer(lambdaId, serverId);
      const req = await request(server).delete(`/servers/${  serverId  }/messages/uwu`).set('Authorization', `Basic ${  lambdaToken}`);
      assert.strictEqual(req.res.statusCode, 403);
      assert.strictEqual(await r.table('messages').count().run(), 1);
    });
  });
});
