const OPCODES = require('../../opcodes.json')
const { getServersOfUser } = require('../DatabaseHandler.js')
const logger = require('../logger.js')
const WebSocket = require('ws')

/**
 * Dispatch a HELLO payload to a client
 * @param {WebSocket} client The client to dispatch to
 */
async function dispatchHello (client) {
  const servers = await getServersOfUser(client.user.id)
  const payload = {
    op: OPCODES.Hello,
    d: servers
  }

  send([client], payload)
}

/**
 * Dispatch a presence update to all connected clients
 * @param {Set<WebSocket>} clients The clients to dispatch the payload to
 * @param {String} userId The user whose presence was updated
 * @param {Boolean} status The status of the user
 */
function dispatchPresenceUpdate (clients, userId, status) {
  const payload = {
    op: OPCODES.DispatchPresence,
    d: {
      id: userId,
      status
    }
  }

  send(clients, payload)
}

/**
 * Dispatches a user message to the provided clients
 * @param {Set<WebSocket>|WebSocket[]} clients The clients to dispatch the message to
 * @param {Object} message The message to send to the clients
 */
function dispatchMessage (clients, message) {
  const payload = {
    op: OPCODES.DispatchMessage,
    d: message
  }
  send(clients, payload)
}

/**
 * Dispatches a member object to the provided clients
 * @param {Set<WebSocket>|WebSocket[]} clients The clients to dispatch the member to
 * @param {Number} serverId The serverId that the member was added to
 * @param {Object} member The member to send to the clients
 */
function dispatchMember (clients, serverId, member) {
  const payload = {
    op: OPCODES.DispatchMemberAdd,
    d: {
      server: serverId,
      member
    }
  }
  send(clients, payload)
}

/**
 * Dispatches a member leave payload to the provided clients
 * @param {Set<WebSocket>|WebSocket[]} clients The clients to dispatch the payload to
 * @param {String} username The name of the user who left
 * @param {Number} serverId The ID of the server the member left
 */
function dispatchMemberLeave (clients, username, serverId) {
  const payload = {
    op: OPCODES.DispatchMemberLeave,
    d: {
      user: username,
      server: serverId,
      kicked: false // soon
    }
  }
  send(clients, payload)
}

/**
 * Dispatches a list of members to the given client
 * @param {WebSocket} client The client to dispatch the members to
 * @param {Array} members The list of members
 */
function dispatchMembers (client, members) {
  const payload = {
    op: OPCODES.DispatchMembers,
    d: members
  }
  send([client], payload)
}

/**
 * Dispatches a guildJoin op to the given clients
 * @param {Set<WebSocket>|WebSocket[]} clients The client to dispatch the event to
 * @param {Object} server The server object to be dispatched
 */
function dispatchServerJoin (clients, server) {
  const payload = {
    op: OPCODES.DispatchServerJoin,
    d: server
  }

  send(clients, payload)
}

/**
 * Dispatches a guildLeave op to the given clients
 * @param {Set<WebSocket>|WebSocket[]} clients The client to dispatch the event to
 * @param {String} serverId The id of the server that was deleted
 */
function dispatchServerLeave (clients, serverId) {
  const payload = {
    op: OPCODES.DispatchServerLeave,
    d: serverId
  }

  send(clients, payload)
}

/**
 * Dispatch a payload to the provided clients
 * @param {Set<WebSocket>|WebSocket[]} clients The clients to dispatch the payload to
 * @param {Object} payload The payload to send to the clients
 */
function send (clients, payload) {
  logger.debug('Dispatching OP {0} to {1} clients', payload.op, clients.size || clients.length)
  payload = JSON.stringify(payload)

  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
    }
  })
}

module.exports = {
  dispatchHello,
  dispatchPresenceUpdate,
  dispatchMessage,
  dispatchMember,
  dispatchMemberLeave,
  dispatchMembers,
  dispatchServerJoin,
  dispatchServerLeave
}
