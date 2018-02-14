const WebSocket = require('ws');
//const RethinkDB = require('rethinkdbdash');

const server = new WebSocket.Server({ port: 443 });
console.log('Listening!');

server.on('connection', (client, req) => {
    console.log('Client connecting...');
    const auth = authenticate(client, req);
    if (auth.authenticated) {
        console.log('Client authenticated: ' + auth.userID);
        client.userID = auth.userID;
        client.send(JSON.stringify({
            op: OPCODES.DispatchServers,
            d: users.find(u => u.name === client.userID).servers
        }));
        client.on('message', handleIncomingData);
    } else {
        console.log('Client tried to connect but failed auth');
        client.close(4001, 'Unauthorized: Invalid User ID');
    }
});

function authenticate(client, req) {
    const auth = { authenticated: false };

    if (req.headers.authorization) {
        const encryptedAuth = req.headers.authorization.split(' ')[1];
        if (encryptedAuth) {
            const decryptedAuth = Buffer.from(encryptedAuth, 'base64').toString();
            console.log(decryptedAuth);
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

    if (!j) return; // Invalid data received

    const op = j.op;

    switch(op) {
        case OPCODES.Message: // eslint-disable-line
            const serverM = j.d.s;
            const message = j.d.m;

            const responseM = {
                op: OPCODES.DispatchMessage,
                d: {
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
    const clients = server.clients
        .filter(client => client.readyState === WebSocket.OPEN && users.find(u => u.name === client.userID).servers.includes(serverID));

    clients.forEach(client => client.send(data));
}

function safeParse(data) {
    try {
        return JSON.parse(data);
    } catch (exception) {
        return null;
    }
}

const OPCODES = {
    'DispatchJoin': 1,
    'DispatchMessage': 2,
    'DispatchServers': 3,
    'Message': 4,
    'JoinServer': 5
};

const users = [
    {
        name: 'Kromatic',
        password: 'williamisgay2',
        servers: [12345]
    }
];