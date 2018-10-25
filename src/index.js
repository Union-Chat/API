import config from '../Configuration'

import path from 'path'
import express from 'express'
import api from './api'
import socket, { socketDestroy, socketInit } from './socket'
import { resetPresenceStates } from './database'
// import voice from './voice'

const app = express()
app.use('/api', api)
app.use('/dist', express.static(`${__dirname}/../dist`))
app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../index.html')))

app.listen(config.web.port)
socket.listen(config.ws.port, socketInit)
// voice.listen(config.voicews.port)

process.on('SIGINT', async () => {
  socketDestroy()
  resetPresenceStates().finally(process.exit)
})
