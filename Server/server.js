const WebSocket = require('ws');
//const RethinkDB = require('rethinkdbdash');

const server = new WebSocket.Server({ port: 443 });
console.log('Listening!');

server.on('connection', (client, req) => {
    const auth = authenticate(client, req);
    if (auth.authenticated) {
        client.userID = auth.userID;

        client.send(JSON.stringify({
            op: OPCODES.Hello,
            d: null
        }));

        client.send(JSON.stringify({
            op: OPCODES.DispatchServers,
            d: users.find(u => u.name === client.userID).servers
        }));

        client.on('message', handleIncomingData);
        client.on('error', () => {});
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
                auth.userID = name;
            }
        }
    }

    return auth;
}

function handleIncomingData(data) {
    const j = safeParse(data);
    console.log(j);

    if (!j) return; // Invalid data received

    const op = j.op;

    switch(op) {
        case OPCODES.Message: // eslint-disable-line
            const serverM = j.d.s;
            const message = j.d.m;

            const responseM = {
                op: OPCODES.DispatchMessage,
                d: {
                    server: serverM,
                    m: message
                }
            };
            send(serverM, responseM);

            break;
        case OPCODES.JoinServer: // eslint-disable-line
            const serverJ = j.d.s;
            const user = j.d.u;

            const responseJ = {
                op: OPCODES.DispatchJoin,
                d: {
                    u: user
                }
            };
            send(serverJ, responseJ);
            break;
    }
}

function send(serverID, data) {
    console.log('iterating')
    console.log(server)
    console.log(server.clients);
    server.clients.forEach(client => {
        console.log(client)
        console.log(client.readyState)
        console.log(WebSocket.OPEN)
        console.log(users.find(u => u.name === client.userID))
        if (client.readyState === WebSocket.OPEN) {
            if (users.find(u => u.name === client.userID).servers.includes(serverID)) {
                client.send(JSON.stringify(data));
            }
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
    'Message': 5,
    'JoinServer': 6
};

const users = [
    {
        name: 'Kromatic',
        password: 'williamisgay2',
        servers: [12345]
    }
];