const { getSessionsOf } = require('./Utils.js');
const { dispatchPresenceUpdate } = require('./Dispatcher.js');
const { getUser, updatePresenceOf } = require('./DatabaseHandler.js');


async function handlePresenceUpdate (userId, clients) {
  const { online } = await getUser(userId);
  const sessions = getSessionsOf(userId, clients);

  const newState = 0 < sessions;
  const shouldUpdate = newState !== online;

  if (shouldUpdate) {
    updatePresenceOf(userId, newState);
    dispatchPresenceUpdate(clients, userId, newState);
  }
}


module.exports = {
  handlePresenceUpdate
};
