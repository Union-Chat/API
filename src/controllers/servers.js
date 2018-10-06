import config from '../../Configuration'
import {
  createServer, deleteServer, getOwnedServers, isInServer, ownsServer,
  removeMemberFromServer
} from '../DatabaseHandler'
import { deduplicate, filter, getClientsById, remove as utilRemove } from '../Utils'
import { dispatchMemberLeave, dispatchServerJoin, dispatchServerLeave } from '../Dispatcher'

export async function create (req, res) {  // this feels so inconsistent lul
  const { name, iconUrl } = req.body

  if (!name || 0 === name.trim().length) {
    return res.status(400).json({ 'error': 'Server name cannot be empty.' })
  }

  if (await getOwnedServers(req.user.id) >= config.rules.maxServersPerUser) {
    return res.status(400).json({ 'error': `You cannot create more than ${config.rules.maxServersPerUser} servers` })
  }

  const server = await createServer(name, iconUrl, req.user.id)

  res.status(200).send()

  const clients = getClientsById(global.server.clients, req.user.id)

  if (0 < clients.length) {
    clients.forEach(ws => ws.user.servers = deduplicate(ws.user.servers, server.id))
    dispatchServerJoin(clients, server)
  }
}

export async function leave (req, res) {
  const { serverId } = req

  if (!await isInServer(req.user.id, serverId)) {
    return res.status(400).json({ 'error': 'You are not in that server' })
  }

  await removeMemberFromServer(req.user.id, serverId)
  dispatchServerLeave(getClientsById(global.server.clients, req.user.id), serverId)

  const self = await getClientsById(global.server.clients, req.user.id)
  const members = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId))

  if (0 < members.length) {
    dispatchMemberLeave(members, req.user.id, serverId)
  }

  if (0 < self.length) {
    self.forEach(ws => remove(ws.user.servers, serverId))
  }

  res.status(200).send()
}

export async function remove (req, res) {
  const { serverId } = req

  if (!await ownsServer(req.user.id, serverId)) {
    return res.status(403).json({ 'error': 'You can only delete servers that you own.' })
  }

  await deleteServer(serverId)

  res.status(200).send()

  const clients = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId))

  if (0 < clients.length) {
    clients.forEach(ws => utilRemove(ws.user.servers, serverId))
    dispatchServerLeave(clients, serverId)
  }
}
