const config = require('./Configuration.json');
const fs = require('fs');

/* Server middleware */
const { authenticate, resetPresenceStates } = require('./DatabaseHandler.js');
const { dispatchHello } = require('./Dispatcher.js');
const { handlePresenceUpdate } = require('./EventHandler.js');
const logger = require('./Logger.js');

/* Server */
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const api = require('./API.js');

/* Apps */
const wss = process.argv.includes('--use-insecure-ws')
  ? http.createServer()
  : https.createServer({
    cert: fs.readFileSync(config.ws.certPath),
    key: fs.readFileSync(config.ws.keyPath),
  });

const server = new WebSocket.Server({ server: wss });
const app = express.Router();
global.server = server;


server.on('connection', async (client, req) => {
  if (!req.headers.authorization) {
    setTimeout(() => {
      if (!client.user && client.readyState !== WebSocket.CLOSED) { // Not logged in
        client.close(4001, 'Unauthorized: Invalid credentials');
      }
    }, 30e3); // 30 second grace period to login
  } else {
    checkLogin(client, req.headers.authorization);
  }

  client.on('message', (data) => {
    if ('string' === typeof data && data.startsWith('Basic ') && !client.isAuthenticated) {
      checkLogin(client, data);
    }
  });
  client.on('error', (error) => logger.warn('Client encountered an error\n\tisAuthenticated: {0}\n\tUser: {1}\n\tError: {2}', client.isAuthenticated, client.user, error));
  client.on('close', () => client.user && handlePresenceUpdate(client.user.id, server.clients));
  client.on('pong', () => client.isAlive = true);
});


async function checkLogin (client, data) {
  const user = await authenticate(data);

  if (!user) {
    return client.close(4001, 'Unauthorized: Invalid credentials');
  }

  logger.info('Client connected\n\t{0}\n\t{1} clients connected', user.id, server.clients.size);
  client._un = user.id;
  client.user = user;
  client.isAlive = true;
  client.isAuthenticated = true;

  await dispatchHello(client);
  handlePresenceUpdate(client.user.id, server.clients);
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/views`));
app.use('/api', api);
app.use(allowCORS);

function allowCORS (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}


wss.listen(config.ws.port, () => {
  logger.info('[WS] Server started on port {0}', config.ws.port);
  setInterval(() => {
    server.clients.forEach(ws => {
      if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
        return;
      }

      if (!ws.isAlive && ws.isAuthenticated) {
        logger.info('Client disconnected\n\t{0}\n\t{1} clients connected', ws._un, server.clients.size - 1);
        handlePresenceUpdate(ws.user.id, server.clients);
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 10e3);
});

process.on('SIGINT', async () => {
  server.clients.forEach(ws => ws.close(1000));
  await resetPresenceStates();

  process.exit();
});

exports.router = app;