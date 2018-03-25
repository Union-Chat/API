const WebSocket = require('ws');
const r = require('rethinkdbdash')({
    db: 'union'
});


/**
 * Dispatch a HELLO payload to a client
 * @param {WebSocket} client The client to dispatch to
 */
async function dispatchHello(client) { // eslint-disable-line
    const servers = await r.table('servers').getAll(...client.user.servers).coerceTo('array');
    const payload = JSON.stringify({
        op: OPCODES.Hello,
        d: servers
    });

    send([client], payload);
}


/**
 * Dispatch a presence update to all connected clients
 * @param {WebSocket} client The client whose presence was updated
 * @param {Set<WebSocket>} clients The clients to dispatch the payload to
 */
async function dispatchPresenceUpdate(client, clients) {
    const { user } = client;
    const sessions = clients.filter(ws => ws.user.id === user.id);
    const payload = {
        op: OPCODES.DispatchPresence,
        d: {
            user_id: user.id
        }
    }

    if (sessions.length === 0) {
        user.online = false;
    } else {
        user.online = true;
    }

    payload.d.status = user.online;
    send(clients, data);
}


/**
 * Dispatch a payload to the provided clients
 * @param {Set<WebSocket>|WebSocket[]} clients The clients to dispatch the payload to
 * @param {Object} payload The payload to send to the clients
 */
async function send(clients, payload) {
    payload = JSON.stringify(payload);
    clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    });
}


const OPCODES = {
    'Heartbeat': 0,
    'Hello': 1,
    'DispatchJoin': 2,
    'DispatchMessage': 3,
    'DispatchPresence': 4,
    'DispatchMembers': 5,
    'SyncMembers': 6,
    'Message': 7,
    'JoinServer': 8
};


/* Polyfill */
Object.assign(Set.prototype, 'filter', {
    value(expression) {
        const results = [];
        this.forEach(item => expression(item) && results.push(item));
        return results;
    }
});
