const config = require('../Configuration.json')
const logger = require('./Logger.js')
const fs = require('fs')

const https = require('https')
const WebSocket = require('ws')

const wss = https.createServer({
  cert: fs.readFileSync(config.ws.certPath),
  key: fs.readFileSync(config.ws.keyPath)
})
const voiceSocket = new WebSocket.Server({ server: wss })
global.voiceServer = voiceSocket

voiceSocket.on('connection', async (client, req) => {
  client.clientId = generateClientId()
  logger.info('Connection from {0} (Assigned client-id {1})', client._socket.remoteAddress, client.clientId)

  client.on('message', (data) => {
    voiceSocket.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN && ws.clientId !== client.clientId) {
        ws.send(data, {
          binary: true
        })
      }
    })
  })
})

function generateClientId () {
  let largestId = 1

  voiceSocket.clients.forEach(ws => {
    if (ws.clientId && ws.clientId > largestId) {
      largestId = ws.clientId
    }
  })

  return largestId + 1
}

function start () {
  wss.listen(config.voicews.port, () => {
    logger.info('[VWS] Voice WebSocket started on port {0}', config.voicews.port)
  })
}

function shutdown () {
  wss.close()
}

module.exports = {
  start,
  shutdown
}
