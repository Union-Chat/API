const OPCODES = require('./OpCodes.json');
const { filter, safeParse, getSessionsOf } = require('./Utils.js');
const { dispatchMessage, dispatchMembers, dispatchPresenceUpdate } = require('./Dispatcher.js');
const { getUsersInServer, storeMessage, retrieveMessage, getUser, updatePresenceOf } = require('./DatabaseHandler.js');
const { randomBytes } = require('crypto');


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

        const id = randomBytes(15).toString('hex');
        storeMessage(id, client.user.id);

        const message = {
            id,
            server,
            content: content.trim(),
            author: client.user.id,
            createdAt: Date.now()
        };

        const recipients = filter(clients, ws => ws.user && ws.user.servers.includes(server));
        dispatchMessage(recipients, message);
    } else if (data.op === OPCODES.SyncMembers) {
        const members = await getUsersInServer(data.d);
        dispatchMembers(client, members);
    } else if (data.op === OPCODES.DeleteMessage) {
        const msg = await retrieveMessage(data.d);

        if (!msg) {
            return client.send(JSON.stringify({
                op: OPCODES.Error,
                d: `Message ${data.d} doesn't exist`
            }));
        }

        if (msg.author !== client.user.id) {
            return client.send(JSON.stringify({ // all of these need moving to dispatcher
                op: OPCODES.Error,
                d: `Cannot delete ${data.d}: Not the author`
            }));
        }

        const payload = JSON.stringify({
            op: OPCODES.DispatchDeleteMessage,
            d: data.d
        });

        clients.forEach(ws => ws.send(payload)); // move to dispatcher

    }
}


async function handlePresenceUpdate(userId, clients) {
    const { online } = await getUser(userId);
    const sessions = getSessionsOf(userId, clients);

    if (sessions === 0) { // User logs off
        updatePresenceOf(userId, false);
        dispatchPresenceUpdate(userId, false, clients);
    } else {
        if (online) {
            return; // User is already cached as online in the database, don't update
        }

        updatePresenceOf(userId, true);
        dispatchPresenceUpdate(userId, true, clients);
    }
}


module.exports = {
    handleIncomingData,
    handlePresenceUpdate
};
