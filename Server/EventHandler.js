const OPCODES = require('./OpCodes.json');
const { filter, safeParse } = require('./Utils.js');
const { dispatchMessage, dispatchMembers } = require('./Dispatcher.js');
const { getUsersInServer } = require('./AccountHandler.js');


/**
 * Handles incoming websocket messages
 * @param {WebSocket} client The client that sent the data
 * @param {String} data The data sent by the client
 * @param {Set<WebSocket>} clients The clients that payloads should be forwarded to if necessary
 */
async function handleIncomingData(client, data, clients) {
    data = safeParse(data);
    if (!data || !data.op) {
        return;
    }

    if (data.op === OPCODES.Message) {
        const { server, content } = data.d;

        if (!client.user.servers.includes(server)) {
            return client.send(JSON.stringify({
                op: OPCODES.Error,
                d: 'You cannot send messages to this server'
            }));
        }

        if (content.trim().length === 0) {
            return client.send(JSON.stringify({
                op: OPCODES.Error,
                d: 'You cannot send empty messages'
            }));
        }

        if (content.trim().length > 500) {
            return client.send(JSON.stringify({
                op: OPCODES.Error,
                d: 'Content cannot exceed 500 characters'
            }));
        }

        const message = {
            server,
            content: content.trim(),
            author: client.user.id
        };

        const recipients = filter(clients, ws => ws.user.servers.includes(server));
        dispatchMessage(recipients, message);
    } else if (data.op === OPCODES.SyncMembers) {
        const members = await getUsersInServer(data.d);
        dispatchMembers(client, members);
    } else if (data.op === OPCODES.Heartbeat) {
        if (!client.hasPinged) {
            client.hasPinged = true;
            client.lastHeartbeat = Date.now();
        }
    }
}


module.exports = {
    handleIncomingData
};
