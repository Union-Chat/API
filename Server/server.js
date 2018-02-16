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

        client.on('message', (data) => handleIncomingData(data, client));
        client.on('error', () => {});
        client.on('close', () => dispatchLogoff(client));

        dispatchServers(client);
        dispatchLogon(client);
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
                content: `${client.user.name} has logged on`,
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
                content: `${client.user.name} has logged off`,
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
    }
}

function send(serverID, data) {
    server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.user.servers.includes(serverID)) {
            client.send(JSON.stringify(data));
        }
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
    'Message': 6,
    'JoinServer': 7
};

const users = [
    {
        name: 'Guest',
        password: '',
        servers: [12345]
    },
];

const servers = [
    {
        id: 12345,
        name: 'Default Server'
    }
];