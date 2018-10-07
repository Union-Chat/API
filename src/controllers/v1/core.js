import config from '../../../Configuration'

export function home (req, res) {
  res.send('Welcome to the Union API!')
  // TODO: Serve docs or something
}

export function info (req, res) {
  res.send({
    api_version: 1,
    websocket: config.ws.port,
    voice: config.voicews.port,
    app_settings: {
      max_servers: config.rules.maxServersPerUser,
      max_message_characters: config.rules.messageCharacterLimit,
      max_username_characters: config.rules.usernameCharacterLimit
    }
  })
}
