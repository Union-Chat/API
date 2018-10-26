import config from '../../Configuration'
import {
  createServer, deleteServer, getOwnedServers, getServer, isInServer, ownsServer, removeMemberFromServer, updateServer
} from '../database'
import { deduplicate, filter, getClientsById, remove as utilRemove } from '../utils'
import { dispatchEvent } from '../socket/dispatcher'

export async function create (req, res) {
  const { name, iconUrl } = req.body
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Server name cannot be empty' })
  }

  if (name.trim().length > config.rules.serverCharacterLimit) {
    return res.status(400).json({ error: `Server name cannot exceed ${config.rules.serverCharacterLimit} characters` })
  }

  if (await getOwnedServers(req.user.id) >= config.rules.maxServersPerUser) {
    return res.status(400).json({ error: `You cannot create more than ${config.rules.maxServersPerUser} servers` })
  }

  const server = await createServer(name, iconUrl, req.user.id)
  res.sendStatus(204)

  if (global.server) { // May not be declared in unit tests
    const clients = getClientsById(global.server.clients, req.user.id)
    if (clients.length > 0) {
      clients.forEach(ws => { ws.user.servers = deduplicate(ws.user.servers, server.id) })
      dispatchEvent(clients, 'SERVER_CREATE', server)
    }
  }
}

export async function patch (req, res) {
  const { name, iconUrl } = req.body

  if (!await ownsServer(req.user.id, req.serverId)) {
    return res.status(403).json({ error: 'You don\'t own this server' })
  }

  if (name !== undefined) {
    if (name.trim().length === 0) {
      return res.status(400).json({ error: 'Server name cannot be empty' })
    }

    if (name.trim().length > config.rules.serverCharacterLimit) {
      return res.status(400).json({ error: `Server name cannot exceed ${config.rules.serverCharacterLimit} characters` })
    }
  }

  await updateServer(req.serverId, name, iconUrl)
  res.sendStatus(204)

  if (global.server) {
    const clients = getClientsById(global.server.clients, req.user.id)
    if (clients.length > 0) {
      const server = await getServer(req.serverId)
      clients.forEach(ws => { ws.user.servers = deduplicate(ws.user.servers, server.id) })
      dispatchEvent(clients, 'SERVER_UPDATE', server)
    }
  }
}

export async function leave (req, res) {
  const { serverId } = req

  if (!await isInServer(req.user.id, serverId)) {
    return res.status(400).json({ error: 'You are not in that server' })
  }

  if (await ownsServer(req.user.id, serverId)) {
    return res.status(400).json({ error: 'You cannot leave a server that you own' })
  }

  await removeMemberFromServer(req.user.id, serverId)
  res.sendStatus(204)

  if (global.server) {
    dispatchEvent(getClientsById(global.server.clients, req.user.id), 'SERVER_DELETE', serverId)

    const self = await getClientsById(global.server.clients, req.user.id)
    const members = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId))

    if (members.length > 0) {
      // reason: SELF, KICKED:reason why this kid was kicked, BANNED:this user is still a kid (soon)
      dispatchEvent(members, 'SERVER_MEMBER_LEAVE', { user: req.user.id, server: serverId, reason: 'SELF' })
    }

    if (self.length > 0) {
      self.forEach(ws => utilRemove(ws.user.servers, serverId))
    }
  }
}

export async function remove (req, res) {
  const { serverId } = req

  if (!await ownsServer(req.user.id, serverId)) {
    return res.status(403).json({ error: 'You can only delete servers that you own' })
  }

  await deleteServer(serverId)
  res.sendStatus(204)

  if (global.server) {
    const clients = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId))

    if (clients.length > 0) {
      clients.forEach(ws => utilRemove(ws.user.servers, serverId))
      dispatchEvent(clients, 'SERVER_DELETE', serverId)
    }
  }
}
