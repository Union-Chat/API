/* Server middleware */
const { authenticate, create } = require('./DatabaseHandler.js');
const { dispatchHello } = require('./Dispatcher.js');
const { handleIncomingData, handlePresenceUpdate } = require('./EventHandler.js');

/* Server */
const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');

/* Apps */
const app = express();
const server = new WebSocket.Server({ port: 443 }, () => {
    console.log(`[WS] Server started on port ${server.options.port}`); // eslint-disable-line
    setInterval(() => {
        server.clients.forEach(ws => {
            if (!ws.isAlive) {
                console.log(`WS Died\n\t${ws.user}\n\t${ws}`);
                handlePresenceUpdate(ws.user.id, server.clients);
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 10e3);
});


server.on('connection', async (client, req) => {
    if (!req.headers.authorization) {
        return client.close(4001, 'Unauthorized: Invalid credentials');
    }

    const auth = req.headers.authorization.split(' ')[1];
    const decrypted = Buffer.from(auth, 'base64').toString();
    const [name, password] = decrypted.split(':');
    const user = await authenticate(name, password);

    if (user === null) {
        return client.close(4001, 'Unauthorized: Invalid credentials');
    }

    client.on('message', (data) => handleIncomingData(client, data, server.clients));
    client.on('error', () => {});
    client.on('close', () => handlePresenceUpdate(client.user.id, server.clients));
    client.on('pong', () => client.isAlive = true);

    client.user = user;
    client.isAlive = true;

    await dispatchHello(client);
    handlePresenceUpdate(client.user.id, server.clients);
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/views`));

app.post('/create', async (req, res) => {
    const { username, password } = req.body;

    if (username.trim().length === 0) {
        return res.send('Username cannot be empty.');
    }

    if (username.trim().length > 15) {
        return res.send('Username cannot exceed 15 characters.');
    }

    if (password.length === 0) {
        return res.send('Password cannot be empty.');
    }

    const created = await create(username.trim(), password);

    if (created) {
        return res.send('Account created! Login with the Union client.');
    } else {
        return res.send('Looks like that account exists, sad.');
    }

});

app.listen(42069);
