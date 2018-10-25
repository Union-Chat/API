import { filter, getSessionsOf } from './utils'
import { dispatchEvent } from './socket/dispatcher'
import { getUser, updatePresenceOf } from './database'

export async function handlePresenceUpdate (userId) {
  const { servers, online } = await getUser(userId)
  const serverIds = servers.map(s => s.id)
  const sessions = getSessionsOf(userId, global.server.clients)

  const newState = sessions > 0
  const shouldUpdate = newState !== online

  if (shouldUpdate) {
    await updatePresenceOf(userId, newState)
    // Filter clients who share a server with the user
    const clients = filter(global.server.clients, c => c.user.servers.filter(s => serverIds.indexOf(s.id) !== -1).length !== 0)
    dispatchEvent(clients, 'PRESENCE_UPDATE', { id: userId, state: newState })
  }
}
