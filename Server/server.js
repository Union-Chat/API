const OPCODES = require('./OpCodes.json');
const { filter } = require('./Utils.js');
const { authenticate, create } = require('./AccountHandler.js');
const { dispatchHello, dispatchPresenceUpdate } = require('./Dispatcher.js');
const { handleIncomingData } = require('./EventHandler.js');
const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const server = new WebSocket.Server({ port: 443 }, () => {
    console.log(`[WS] Server started on port ${server.options.port}`); // eslint-disable-line
    setInterval(sweepClients, 60e3);
});


server.on('connection', async (client, req) => {
    if (!req.headers.authorization) {
        client.close(4001, 'Unauthorized: Invalid credentials');
    } else {
        const auth = req.headers.authorization.split(' ')[1];
        const decrypted = Buffer.from(auth, 'base64').toString();
        const [name, password] = decrypted.split(':');
        const user = await authenticate(name, password);

        if (user === null) {
            client.close(4001, 'Unauthorized: Invalid credentials');
        } else {
            client.on('message', (data) => handleIncomingData(client, data, server.clients));
            client.on('error', () => {});
            client.on('close', () => dispatchPresenceUpdate(client, server.clients));
            client.on('pong', () => client.isAlive = true);

            client.user = user;
            client.isAlive = true;

            await dispatchHello(client);
            await dispatchPresenceUpdate(client, server.clients);
        }
    }
});


function sweepClients() {
    server.clients.forEach(ws => {
        if (!ws.isAlive) {
            return ws.terminate();
        } else {
            ws.isAlive = false;
            ws.ping();
        }
    });
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/views`));

app.post('/create', async (req, res) => {
    const { username, password } = req.body;
    const created = await create(username, password);

    if (created) {
        return res.send('Account created! Login with the Union client.');
    } else {
        return res.send('Looks like that account exists, sad.');
    }

});

app.listen(42069);
