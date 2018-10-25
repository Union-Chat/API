import config from '../../Configuration'

import { randomBytes } from 'crypto'
import { deleteMessage, isInServer, ownsServer, retrieveMessage, storeMessage } from '../database'
import { dispatchEvent } from '../socket/dispatcher'
import { filter } from '../utils'

export async function post (req, res) {
  const { serverId } = req
  const { content } = req.body

  if (!req.user.servers.includes(serverId)) {
    return res.status(403).json({ error: 'You cannot send messages to this server' })
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content must be a string and not empty' })
  }

  if (content.length > config.rules.messageCharacterLimit) {
    return res.status(400).json({ error: `Content cannot exceed ${config.rules.messageCharacterLimit} characters` })
  }

  const id = randomBytes(15).toString('hex')
  await storeMessage(id, req.user.id, serverId, content)
  res.sendStatus(204)

  if (global.server) {
    const recipients = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId))
    dispatchEvent(recipients, 'MESSAGE_CREATE', {
      id,
      server: serverId,
      content: content.trim(),
      author: req.user.id,
      createdAt: Date.now()
    })
  }
}

export async function patch (req, res) {
  const { serverId } = req
  const { content } = req.body
  const message = await retrieveMessage(req.params.messageId)

  if (!message) return res.sendStatus(404)
  if (message.server !== serverId) return res.sendStatus(404)

  if (!req.user.servers.includes(serverId)) {
    return res.status(403).json({ error: 'You are not in the server' })
  }

  if (req.user.id !== message.author) {
    return res.status(403).json({ error: 'You are not the author of this message' })
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content must be a string and not empty' })
  }

  if (content.length > config.rules.messageCharacterLimit) {
    return res.status(400).json({ error: `Content cannot exceed ${config.rules.messageCharacterLimit} characters` })
  }

  res.sendStatus(204)
  if (global.server) {
    const recipients = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId))
    dispatchEvent(recipients, 'MESSAGE_UPDATE', await retrieveMessage(req.params.messageId))
  }
}

export async function remove (req, res) {
  const { serverId } = req
  const message = await retrieveMessage(req.params.messageId)

  if (!message) return res.sendStatus(404)
  if (message.server !== serverId) return res.sendStatus(404)

  if (!req.user.servers.includes(serverId)) {
    return res.status(403).json({ error: 'You are not in the server' })
  }

  if (req.user.id !== message.author && !await ownsServer(req.user.id, serverId)) {
    return res.status(403).json({ error: 'You are neither the author nor the server owner' })
  }

  await deleteMessage(req.params.messageId)
  res.sendStatus(204)
  if (global.server) {
    const recipients = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId))
    dispatchEvent(recipients, 'MESSAGE_DELETE', req.params.messageId)
  }
}
