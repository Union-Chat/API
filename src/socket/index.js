import config from '../../Configuration'
import fs from 'fs'
import http from 'http'
import https from 'https'
import WebSocket from 'ws'

import { authenticate, resetPresenceStates } from '../DatabaseHandler.js'
import { dispatchHello } from './dispatcher.js'
import { handlePresenceUpdate } from '../EventHandler.js'
import logger from '../logger.js'

/* Apps */
let server = process.argv.includes('--use-insecure-ws')
  ? http.createServer()
  : https.createServer({
    cert: fs.readFileSync(config.ws.certPath),
    key: fs.readFileSync(config.ws.keyPath)
  })
const socket = new WebSocket.Server({ server })
global.server = socket

socket.on('connection', async (client, req) => {
  if (!req.headers.authorization) {
    setTimeout(() => {
      if (!client.user && client.readyState !== WebSocket.CLOSED) { // Not logged in
        client.close(4001, 'Unauthorized: Invalid credentials')
      }
    }, 30e3) // 30 second grace period to login
  } else {
    checkLogin(client, req.headers.authorization)
  }

  client.on('message', (data) => {
    if (typeof data === 'string' && data.startsWith('Basic ') && !client.isAuthenticated) {
      checkLogin(client, data)
    }
  })
  client.on('error', (error) => logger.warn('Client encountered an error\n\tisAuthenticated: {0}\n\tUser: {1}\n\tError: {2}', client.isAuthenticated, client.user, error))
  client.on('close', () => client.user && handlePresenceUpdate(client.user.id, socket.clients))
  client.on('pong', () => { client.isAlive = true })
})

async function checkLogin (client, data) {
  const user = await authenticate(data)

  if (!user) {
    return client.close(4001, 'Unauthorized: Invalid credentials')
  }

  logger.info('Client connected\n\t{0}\n\t{1} clients connected', user.id, socket.clients.size)
  client._un = user.id
  client.user = user
  client.isAlive = true
  client.isAuthenticated = true

  await dispatchHello(client)
  handlePresenceUpdate(client.user.id, socket.clients)
}

process.on('SIGINT', async () => {
  socket.clients.forEach(ws => ws.close(1000))
  resetPresenceStates().finally(process.exit)
})

export default server

export function socketInit () {
  logger.info('[WS] Server started on port {0}', config.ws.port)
  setInterval(() => {
    socket.clients.forEach(ws => {
      if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) return

      if (!ws.isAlive && ws.isAuthenticated) {
        logger.info('Client disconnected\n\t{0}\n\t{1} clients connected', ws._un, socket.clients.size - 1)
        handlePresenceUpdate(ws.user.id, socket.clients)
        return ws.terminate()
      }

      ws.isAlive = false
      ws.ping()
    })
  }, 10e3)
}
