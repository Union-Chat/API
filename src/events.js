import { getSessionsOf } from './utils.js'
import { dispatchPresenceUpdate } from './socket/_old/dispatcher.js'
import { getUser, updatePresenceOf } from './database.js'

export async function handlePresenceUpdate (userId, clients) {
  const { online } = await getUser(userId)
  const sessions = getSessionsOf(userId, clients)

  const newState = sessions > 0
  const shouldUpdate = newState !== online

  if (shouldUpdate) {
    await updatePresenceOf(userId, newState)
    dispatchPresenceUpdate(clients, userId, newState)
  }
}
