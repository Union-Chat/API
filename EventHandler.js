const OPCODES = require('./OpCodes.json');
const { safeParse, getSessionsOf } = require('./Utils.js');
const { dispatchMembers, dispatchPresenceUpdate } = require('./Dispatcher.js');
const { getUsersInServer, retrieveMessage, getUser, updatePresenceOf } = require('./DatabaseHandler.js');


/**
 * Handles incoming websocket messages
 * @param {WebSocket} client The client that sent the data
 * @param {String} data The data sent by the client
 * @param {Set<WebSocket>} clients The clients that payloads should be forwarded to if necessary
 */
async function handleIncomingData (client, data) {
  data = safeParse(data);

  if (!data || !data.op) {
    return;
  }

  if (data.op === OPCODES.SyncMembers) { // TODO: Deprecate
    const members = await getUsersInServer(data.d);
    dispatchMembers(client, members);
  }
}


async function handlePresenceUpdate (userId, clients) {
  const { online } = await getUser(userId);
  const sessions = getSessionsOf(userId, clients);

  if (sessions === 0) { // User logs off
    updatePresenceOf(userId, false);
    dispatchPresenceUpdate(userId, false, clients);
  } else if (!online) { // User is already cached as online in the database, don't update
    updatePresenceOf(userId, true);
    dispatchPresenceUpdate(userId, true, clients);
  }
}


module.exports = {
  handleIncomingData,
  handlePresenceUpdate
};
