const WebSocket = require('ws');
const AccountHandler = require('./AccountHandler');
const Dispatcher = require('./Dispatcher.js');
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
            client.on('message', (data) => handleIncomingData(data, client));
            client.on('error', () => {});
            client.on('close', () => updatePresence(client));

            client.user = user;
            client.hasPinged = false;
            client.lastHeartbeat = Date.now();

            Dispatcher.dispatchHello(client);
        }
    }
});

function handleIncomingData(data, client) {
    const j = safeParse(data);

    if (!j) return; // Invalid data received

    const op = j.op;

    switch(op) {
        case OPCODES.Message: // eslint-disable-line
            const serverM = j.d.server;
            const content = j.d.content;

            const responseM = {
                op: OPCODES.DispatchMessage,
                d: {
                    server: serverM,
                    message: {
                        content,
                        author: client.user.name
                    }
                }
            };
            send(serverM, responseM);
            break;

        case OPCODES.SyncMembers: //eslint-disable-line
            const serverID = j.d;
            const members = users.filter(u => u.servers.includes(serverID));
            const responseSync = {
                op: OPCODES.DispatchMembers,
                d: members
            };
            client.send(JSON.stringify(responseSync));
            break;

        case OPCODES.Heartbeat:
            if (!client.hasPinged) {
                client.hasPinged = true;
                client.lastHeartbeat = Date.now();
            }
            break;
    }
}

function sweepClients() {
    const ping = JSON.stringify({ op: OPCODES.Heartbeat, d: null });
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

/*
 * Patch-in functions
 */


function safeParse(data) {
    try {
        return JSON.parse(data);
    } catch (exception) {
        return null;
    }
}
