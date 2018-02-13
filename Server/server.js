const WebSocket = require('ws');
//const RethinkDB = require('rethinkdbdash');

const server = new WebSocket.Server({ port: 443 });

server.on('connection', (client, req) => {
    if (!req.userID) return client.close(401, 'Invalid User ID');
    client.userID = req.userID;
    client.send({
        op: OPCODES.DispatchServers,
        d: users.find(u => u.id === client.userID).servers
    });
    client.on('message', handleIncomingData);
});

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
    const clients = server.clients.filter(client => client.readyState === WebSocket.OPEN && users.find(u => u.id === client.userID).servers.includes(serverID));

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
        id: 123456,
        name: 'Kromatic',
        servers: [12345]
    }
];