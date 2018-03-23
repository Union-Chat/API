const r = require('rethinkdbdash')({
    db: 'union'
});


/**
 *
 * @param {WebSocket} client The client to dispatch to
 */
async function dispatchHello(client) { // eslint-disable-line
    const servers = await r.table('servers').getAll(...client.user.servers).coerceTo('array');
    const payload = JSON.stringify({
        op: OPCODES.Hello,
        d: servers
    });

    client.send(payload);
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
