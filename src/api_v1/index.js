import express from 'express'
import bodyParser from 'body-parser'

import authorize from '../middlewares/authorize'
import allowCORS from '../middlewares/cors'
import validateServer from '../middlewares/serverExists'

import { home, info } from './core'
import { create as userCreate } from './users'
import { create as serverCreate, remove as serverRemove, leave as serverLeave } from './servers'
import { create as inviteCreate, accept as inviteAccept } from './invites'
import { post as messagePost } from './messages'

const api = express.Router()

// Middlewares
api.use(bodyParser.json())
api.use(bodyParser.urlencoded({ extended: true }))
api.use(allowCORS)

// Core
api.get('/', home)
api.get('/info', info)

// User
api.post('/create', userCreate)
api.patch('/self', (req, res) => res.send('Not done.'))

// Servers
api.post('/server', authorize, serverCreate)
api.delete('/server/:serverId', validateServer, authorize, serverRemove)
api.delete('/self/server/:serverId', validateServer, authorize, serverLeave)

api.post('/server/:serverId/invite', validateServer, authorize, inviteCreate)

api.post('/server/:serverId/messages', validateServer, authorize, messagePost)

// Invites
api.post('/invites/:inviteId', authorize, inviteAccept)

export default api
