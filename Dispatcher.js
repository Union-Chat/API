const OPCODES = require('./OpCodes.json');
const { getServersOfUser } = require('./DatabaseHandler.js');
const WebSocket = require('ws');


/**
 * Dispatch a HELLO payload to a client
 * @param {WebSocket} client The client to dispatch to
 */
async function dispatchHello(client) {
    const servers = await getServersOfUser(client.user.id);
    const payload = {
        op: OPCODES.Hello,
        d: servers
    };

    send([client], payload);
}


/**
 * Dispatch a presence update to all connected clients
 * @param {String} userId The user whose presence was updated
 * @param {Boolean} status The status of the user
 * @param {Set<WebSocket>} clients The clients to dispatch the payload to
 */
function dispatchPresenceUpdate(userId, status, clients) {
    const payload = {
        op: OPCODES.DispatchPresence,
        d: {
            id: userId,
            status
        }
    };

    send(clients, payload);
}


/**
 * Dispatches a user message to the provided clients
 * @param {Set<WebSocket>|WebSocket[]} clients The clients to dispatch the message to
 * @param {Object} message The message to send to the clients
 */
function dispatchMessage(clients, message) {
    const payload = {
        op: OPCODES.DispatchMessage,
        d: message
    };
    send(clients, payload);
}


/**
 * Dispatches a list of members to the given client
 * @param {WebSocket} client The client to dispatch the members to
 * @param {Array} members The list of members
 */
function dispatchMembers(client, members) {
    const payload = {
        op: OPCODES.DispatchMembers,
        d: members
    };
    send([client], payload);
}


/**
 * Dispatch a payload to the provided clients
 * @param {Set<WebSocket>|WebSocket[]} clients The clients to dispatch the payload to
 * @param {Object} payload The payload to send to the clients
 */
function send(clients, payload) {
    payload = JSON.stringify(payload);
    clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    });
}


module.exports = {
    dispatchHello,
    dispatchPresenceUpdate,
    dispatchMessage,
    dispatchMembers
};
