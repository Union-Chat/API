const OPCODES = require('./OpCodes.json');
const { filter } = require('./Utils.js');
const AccountHandler = require('./AccountHandler.js');
const { dispatchHello, dispatchPresenceUpdate } = require('./Dispatcher.js');
const { handleIncomingData } = require('./EventHandler.js');
const WebSocket = require('ws');
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
        const user = await AccountHandler.authenticate(name, password);

        if (user === null) {
            client.close(4001, 'Unauthorized: Invalid credentials');
        } else {
            client.on('message', (data) => handleIncomingData(client, data, server.clients));
            client.on('error', () => {});
            client.on('close', () => dispatchPresenceUpdate(client, server.clients));

            client.user = user;
            client.hasPinged = false;
            client.lastHeartbeat = Date.now();

            dispatchHello(client);
        }
    }
});


function sweepClients() {
    const ping = JSON.stringify({ op: OPCODES.Heartbeat, d: null }); // TODO: Move this to dispatcher
    const clients = filter(ws => ws.readyState === WebSocket.OPEN && Date.now() - ws.lastHeartbeat >= 60e3, server.clients);

    clients.forEach(client => client.send(ping));

    setTimeout(() => {
        clients.forEach(client => {
            if (!client.hasPinged)
                client.close(4002, 'Missed heartbeat');

            client.hasPinged = false;
        });
    }, 10e3);
}
