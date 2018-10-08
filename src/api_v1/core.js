import config from '../../Configuration'

export function home (req, res) {
  res.send('Welcome to the Union API!')
  // TODO: Serve docs or something
}

export function info (req, res) {
  res.send({
    apiVersion: 1,
    websocket: config.ws.port,
    voice: config.voicews.port,
    appSettings: config.rules
  })
}
