import config from '../../../Configuration'

export function home (req, res) {
  res.send('Welcome to the Union API!')
}

export function info (req, res) {
  res.send({
    apiVersion: 2,
    websocket: config.ws.port,
    voice: config.voicews.port,
    appSettings: config.rules
  })
}
