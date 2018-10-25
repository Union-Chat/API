import {
  addMemberToServer, generateInvite, getInvite, getMember, getServer, isInServer,
  ownsServer, serverExists
} from '../DatabaseHandler'
import { dispatchMember, dispatchServerJoin } from '../socket/_old/dispatcher'
import { deduplicate, filter, getClientsById } from '../Utils'

export async function create (req, res) {
  const { serverId } = req

  if (!await ownsServer(req.user.id, serverId)) {
    return res.status(403).json({ error: 'Only the server owner can generate invites' })
  }

  const inviteCode = await generateInvite(serverId, req.user.id)

  res.status(200).send({ code: inviteCode })
}

export async function accept (req, res) {
  const invite = await getInvite(req.params.inviteId)

  if (!invite) {
    return res.status(404).json({ error: 'Unknown invite' })
  }

  if (!await serverExists(invite.serverId)) {
    return res.status(404).json({ error: 'Unknown server; invite expired' })
  }

  const { serverId } = invite

  if (await isInServer(req.user.id, serverId)) {
    return res.status(400).json({ error: 'You\'re already in this server' })
  }

  await addMemberToServer(req.user.id, serverId)
  res.sendStatus(204)

  if (global.server) {
    const clients = await getClientsById(global.server.clients, req.user.id)
    const server = await getServer(serverId)

    if (clients.length > 0) {
      clients.forEach(ws => { ws.user.servers = deduplicate(ws.user.servers, serverId) })
      dispatchServerJoin(clients, server)
    }

    const members = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId) && ws.user.id !== req.user.id)
    const member = await getMember(req.user.id)

    if (members.length > 0) {
      dispatchMember(members, serverId, member)
    }
  }
}
