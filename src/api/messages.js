import config from '../../Configuration'

import { randomBytes } from 'crypto'
import { storeMessage } from '../DatabaseHandler'
import { dispatchMessage } from '../socket/dispatcher'
import { filter } from '../Utils'

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
  await storeMessage(id, req.user.id)
  res.sendStatus(204)

  if (global.server) {
    const recipients = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId))
    dispatchMessage(recipients, {
      id,
      server: serverId,
      content: content.trim(),
      author: req.user.id,
      createdAt: Date.now()
    })
  }
}
