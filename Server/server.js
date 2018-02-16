const WebSocket = require('ws');
//const RethinkDB = require('rethinkdbdash');

const server = new WebSocket.Server({ port: 443 });
console.log('Listening!');

server.on('connection', (client, req) => {
    const auth = authenticate(client, req);
    if (auth.authenticated) {
        client.user = auth.user;

        client.send(JSON.stringify({
            op: OPCODES.Hello,
            d: null
        }));

        dispatchServers(client);
        updatePresence(client);
        client.on('message', (data) => handleIncomingData(data, client));
        client.on('error', () => {});
        client.on('close', () => updatePresence(client));
    } else {
        client.close(4001, 'Unauthorized: Invalid Credentials');
    }
});

function authenticate(client, req) {
    const auth = { authenticated: false };

    if (req.headers.authorization) {
        const encryptedAuth = req.headers.authorization.split(' ')[1];
        if (encryptedAuth) {
            const decryptedAuth = Buffer.from(encryptedAuth, 'base64').toString();
            const [name, password] = decryptedAuth.split(':');

            const user = users.find(u => u.name === name && u.password === password);
            if (user) {
                auth.authenticated = true;
                auth.user = user;
            }
        }
    }

    return auth;
}

function updatePresence(client) {
    const { user } = client;
    const sessions = filter(c => c.user.id === user.id, server.clients);

    if (sessions.length === 0) {
        dispatchLogoff(client);
        user.online = false;
        const presence = {
            op: OPCODES.DispatchPresence,
            d: {
                user_id: client.user.id,
                status: user.online
            }
        };
        send(null, presence);
    } else if (sessions.length === 1 && !user.online) {
        dispatchLogon(client);
        user.online = true;
        const presence = {
            op: OPCODES.DispatchPresence,
            d: {
                user_id: client.user.id,
                status: user.online
            }
        };
        send(null, presence);
    }
}

function dispatchServers(client) {
    const dispatch = [];

    for (const server of client.user.servers) {
        const s = servers.find(s => s.id === server);
        if (s)
            dispatch.push(s);
    }

    client.send(JSON.stringify({
        op: OPCODES.DispatchServers,
        d: dispatch
    }));
}

function dispatchLogon(client) {
    const sysMsg = {
        op: OPCODES.DispatchMessage,
        d: {
            message: {
                content: `${client.user.name} is online`,
                author: 'SYSTEM'
            }
        }
    };
    for (const server of client.user.servers) {
        sysMsg.d.server = server;
        send(server, sysMsg);
    }
}

function dispatchLogoff(client) {
    const sysMsg = {
        op: OPCODES.DispatchMessage,
        d: {
            message: {
                content: `${client.user.name} is offline`,
                author: 'SYSTEM'
            }
        }
    };
    for (const server of client.user.servers) {
        sysMsg.d.server = server;
        send(server, sysMsg);
    }
}

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
    }
}

function send(serverID, data) {
    server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && (!serverID || client.user.servers.includes(serverID)))
            client.send(JSON.stringify(data));
    });
}

function safeParse(data) {
    try {
        return JSON.parse(data);
    } catch (exception) {
        return null;
    }
}

const OPCODES = {
    'Hello': 1,
    'DispatchJoin': 2,
    'DispatchMessage': 3,
    'DispatchServers': 4,
    'DispatchPresence': 5,
    'DispatchMembers': 6,
    'SyncMembers': 7,
    'Message': 8,
    'JoinServer': 9
};

const users = [
    {
        id: 1,
        name: 'Test',
        password: 'test',
        servers: [12345],
        online: false
    }
];

const servers = [
    {
        id: 12345,
        name: 'Default Server'
    }
];

/*
 * Patch-in functions
 */

function filter(expression, set) {
    const results = [];

    set.forEach(item => {
        if (expression(item))
            results.push(item);
    });

    return results;
}