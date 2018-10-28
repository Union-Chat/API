/* eslint-env node, mocha */
import './_hooks';

import sinon from 'sinon';
import assert from 'assert';
import WebSocket from 'ws';
import opcodes from '../opcodes';
import { createUser } from '../src/database';
import { dispatchEvent } from '../src/socket/dispatcher';
import socket, { socketDestroy, socketInit } from '../src/socket';

import { migrator, drop } from '../migrations/_migrator';

describe('Core Socket', () => {
  before(async () => {
    socketInit();
    await migrator();
    socket.listen(2096);
  });

  after(async () => {
    socketDestroy();
    socket.close();
    await drop();
    delete require.cache[require.resolve('../src/socket')];
  });

  let ws, token;
  beforeEach(async () => {
    token = Buffer.from(`${await createUser('root', 'root')  }:root`).toString('base64');
    ws = new WebSocket('ws://localhost:2096');
  });

  afterEach(() => {
    try {
      ws.terminate();
    } catch (e) {}
  });

  describe('Connection flow', () => {
    it('should send WELCOME, receive AUTHENTICATE and send HELLO', function (done) {
      this.timeout(10000);
      // Declare functions
      const callbackFn = sinon.fake();
      const close = (close) => {
        assert.notStrictEqual(close.code, 4001);
        assert.strictEqual(callbackFn.callCount, 2);
        assert.strictEqual(callbackFn.getCall(0).args[0], opcodes.Welcome);
        assert.strictEqual(callbackFn.getCall(1).args[0], opcodes.Hello);
        done();
      };

      // Listen to the socket
      ws.on('close', close);
      ws.on('message', m => {
        const data = JSON.parse(m);
        callbackFn(data.op);
        if (data.op === opcodes.Welcome) {
          ws.send(JSON.stringify({ op: opcodes.Authenticate, d: `Basic ${  token}` }));
        } else if (data.op === opcodes.Hello) {
          ws.close(1000);
        }
      });
    });

    it('should close connection if the user does not AUTHENTICATE in 30s', function (done) {
      if ('yes' === process.env.SKIP_LONG_TESTS) {
        return this.skip();
      }
      this.timeout(35000);
      ws.on('close', (e) => {
        assert.strictEqual(e, 4001);
        done();
      });
    });

    it('should close connection if auth token is invalid', (done) => {
      ws.once('message', m => {
        const data = JSON.parse(m);
        assert.notStrictEqual(data.op, opcodes.Hello);
        ws.send(JSON.stringify({ op: opcodes.Authenticate, d: 'Basic uwu' }));
      });
      ws.on('close', code => {
        assert.strictEqual(code, 4001);
        done();
      });
    });
  });

  describe('Subscription flow', () => {
    beforeEach((done) => {
      ws.on('message', m => {
        const data = JSON.parse(m);
        if (data.op === opcodes.Welcome) {
          ws.send(JSON.stringify({ op: opcodes.Authenticate, d: `Basic ${  token}` }));
        } else if (data.op === opcodes.Hello) {
          done();
        }
      });
    });

    it('should send back OK', (done) => {
      let i = 0;
      ws.on('message', m => {
        i++;
        const data = JSON.parse(m);
        assert.strictEqual(data.op, opcodes.OK);
        if (2 === i) {
          done();
        }
      });
      ws.send(JSON.stringify({ op: opcodes.Subscribe, d: [] }));
      ws.send(JSON.stringify({ op: opcodes.Unsubscribe, d: [] }));
    });

    it('should not dispatch if not subscribed', async () => {
      let ws2;
      // STEP 1: Create a new user and connect it to the socket
      await new Promise(async resolve => {
        token = Buffer.from(`${await createUser('sudo', 'sudo')  }:sudo`).toString('base64');
        ws2 = new WebSocket('ws://localhost:2096');
        ws2.on('message', m => {
          const data = JSON.parse(m);
          if (data.op === opcodes.Welcome) {
            ws2.send(JSON.stringify({ op: opcodes.Authenticate, d: `Basic ${  token}` }));
          } else if (data.op === opcodes.Hello) {
            resolve();
          }
        });
      });

      // STEP 2: Unsubscribe user root from PRESENCE_UPDATE events
      await new Promise(resolve => {
        ws.on('message', m => {
          const data = JSON.parse(m);
          if (data.op === opcodes.OK) {
            resolve();
          }
        });
        ws.send(JSON.stringify({ op: opcodes.Unsubscribe, d: ['PRESENCE_UPDATE'] }));
      });

      // STEP 3: Listeners; root should only receive SERVER_CREATE and sudo SERVER_CREATE & PRESENCE_UPDATE
      await new Promise((resolve, reject) => {
        try {
          ws.on('message', m => {
            const data = JSON.parse(m);
            assert.notStrictEqual(data.e, 'PRESENCE_UPDATE');
            assert.strictEqual(data.e, 'SERVER_CREATE');
          });
          let i = 0;
          ws2.on('message', m => {
            const data = JSON.parse(m);
            if (0 === i) {
              assert.strictEqual(data.e, 'SERVER_CREATE');
              dispatchEvent(global.server.clients, 'PRESENCE_UPDATE', 'owo');
            } else {
              assert.strictEqual(data.e, 'PRESENCE_UPDATE');
              resolve();
            }
            i++;
          });
          dispatchEvent(global.server.clients, 'SERVER_CREATE', 'owo');
        } catch (e) {
          reject(e);
        }
      });
    });

    it('should close connection if not subscribed to anything for too long', function (done) {
      if ('yes' === process.env.SKIP_LONG_TESTS) {
        return this.skip();
      }
      this.timeout(35000);
      ws.send(JSON.stringify({ op: opcodes.Unsubscribe, d: [] }));
      ws.once('close', code => {
        assert.strictEqual(code, 4006);
        done();
      });
    });
  });

  describe('Connection closing', () => {
    beforeEach((done) => {
      ws.on('message', () => done());
    });

    it('should close connection if payload is invalid', (done) => {
      ws.send('{op": 4", "d": {"["client1", client2"]}}');
      ws.once('close', code => {
        assert.strictEqual(code, 4002);
        done();
      });
    });

    it('should close connection if opcode is invalid', (done) => {
      ws.send(JSON.stringify({ op: 666, d: 'i\'m evil' }));
      ws.once('close', code => {
        assert.strictEqual(code, 4003);
        done();
      });
    });
  });
});
