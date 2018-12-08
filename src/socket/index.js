import config from '../../Configuration';

import fs from 'fs';
import http from 'http';
import https from 'https';
import WebSocket from 'ws';
import crypto from 'crypto';
import logger from '../logger';
import { handlePresenceUpdate } from '../events';
import receiver from './receiver';
import { dispatchWelcome } from './dispatcher';

// @see socketDestroy
let timeout, interval;
global.__socketSubTimeouts = [];

// Create HTTP server
const server = process.argv.includes('--use-insecure-ws') || 'test' === process.env.NODE_ENV
  ? http.createServer()
  : https.createServer({
    cert: fs.readFileSync(config.ws.certPath),
    key: fs.readFileSync(config.ws.keyPath)
  });
const socket = new WebSocket.Server({ server });
global.server = socket;

socket.on('connection', async (client, req) => {
  const shasum = crypto.createHash('sha1');
  shasum.update(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress);
  const ip = shasum.digest('hex');

  if (global.bannedIps.includes(ip)) {
    return client.close(4007, 'Banned due to API abuse');
  }

  dispatchWelcome(client);
  timeout = setTimeout(() => {
    if (!client.user && client.readyState !== WebSocket.CLOSED) {
      client.close(4001, 'Authentication timed out');
    }
  }, 30e3);
  // Listeners
  client.on('message', (data) => receiver(client, data));
  client.on('error', (error) => logger.warn('Client encountered an error\n\tisAuthenticated: {0}\n\tUser: {1}\n\tError: {2}', client.isAuthenticated, client.user, error));
  client.on('close', () => client.user && handlePresenceUpdate(client.user.id, socket.clients));
  client.on('pong', () => {
    client.isAlive = true;
  });
});

export default server;

export function socketInit () {
  logger.info('[WS] Server started on port {0}', config.ws.port);
  interval = setInterval(() => {
    socket.clients.forEach(async ws => {
      if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
        return;
      }
      if (!ws.isAlive && ws.isAuthenticated) {
        logger.info('Client disconnected\n\t{0}\n\t{1} clients connected', ws._un, socket.clients.size - 1);
        await handlePresenceUpdate(ws.user.id, socket.clients);
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 10e3);
}

export function socketDestroy () {
  logger.info('[WS] Shutting down server');
  socket.clients.forEach(ws => ws.close(1000));

  // Clear intervals; Ensure unit tests process stop when all test are passed. Active intervals/timeouts force
  // the event loop to stay alive
  global.__socketSubTimeouts.forEach(t => clearTimeout(t));
  if (interval) {
    clearInterval(interval);
  }
  if (timeout) {
    clearTimeout(timeout);
  }
}
