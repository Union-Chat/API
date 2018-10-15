const { getSessionsOf } = require('./Utils.js')
const { dispatchPresenceUpdate } = require('./socket/dispatcher.js')
const { getUser, updatePresenceOf } = require('./DatabaseHandler.js')

async function handlePresenceUpdate (userId, clients) {
  const { online } = await getUser(userId)
  const sessions = getSessionsOf(userId, clients)

  const newState = sessions > 0
  const shouldUpdate = newState !== online

  if (shouldUpdate) {
    updatePresenceOf(userId, newState)
    dispatchPresenceUpdate(clients, userId, newState)
  }
}

module.exports = {
  handlePresenceUpdate
}
