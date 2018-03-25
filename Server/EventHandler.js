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
function handleIncomingData(client, data, clients) {
    data = safeParse(data);
    if (!data || !data.op) {
        return;
    }

    if (data.op === OPCODES.Message) {
        const { server, content } = data.d;

        if (!data.client.user.servers.includes(server) || content.trim().length === 0) {
            return;
        }

        const recipients = filter(clients, ws => ws.user.servers.includes(server));
        const message = {
            server,
            content: content.trim(),
            author: client.user.name
        };

        dispatchMessage(recipients, message);
    } else if (data.op === OPCODES.SyncMembers) {
        const { server } = data.d;
        const members = getUsersInServer(server);
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
