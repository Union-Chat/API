const config = require('./Configuration.json');
const fs = require('fs');

/* Server middleware */
const { authenticate } = require('./DatabaseHandler.js');
const { dispatchHello } = require('./Dispatcher.js');
const { handleIncomingData, handlePresenceUpdate } = require('./EventHandler.js');
const { formatString } = require('./Utils.js');

/* Server */
const https = require('https');
const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const api = require('./API.js');

/* Apps */
const wss = https.createServer({
    cert: fs.readFileSync(config.ws.certPath),
    key: fs.readFileSync(config.ws.keyPath),
});
const app = express.Router();
const server = new WebSocket.Server({ server: wss });
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
        if (typeof data === 'string' && data.startsWith('Basic ') && !client.isAuthenticated) {
            checkLogin(client, data);
        } else if (client.isAuthenticated) { // Heck off unauth'd users
            handleIncomingData(client, data, server.clients);
        }
    });
    client.on('error', (error) => console.log(formatString('Client encountered an error\n\tisAuthenticated: {0}\n\tUser: {1}\n\tError: {2}', client.isAuthenticated, client.user, error)));
    client.on('close', () => client.user && handlePresenceUpdate(client.user.id, server.clients));
    client.on('pong', () => client.isAlive = true);
});


async function checkLogin(client, data) {
    const user = await authenticate(data);

    if (!user) {
        return client.close(4001, 'Unauthorized: Invalid credentials');
    }

    console.log(`Connection from ${user.id} established | Clients: ${server.clients.size}`); // eslint-disable-line
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

wss.listen(config.ws.port, () => {
    console.log(`[WS] Server started on port ${config.ws.port}`); // eslint-disable-line
    setInterval(() => {
        server.clients.forEach(ws => {
            if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
                return;
            }

            if (!ws.isAlive && ws.isAuthenticated) {
                console.log(`WS Died\n\t${ws._un}\n\t${server.clients.size - 1} clients`); // eslint-disable-line
                handlePresenceUpdate(ws.user.id, server.clients);
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping();
        });
    }, 10e3);
});

exports.router = app;

process.on('SIGINT', () => {
    server.clients.forEach(ws => ws.close(1000));
    process.exit();
});
