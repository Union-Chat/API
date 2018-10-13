import express from 'express'
import bodyParser from 'body-parser'

import allowCORS from '../middlewares/cors'
import authorize from '../middlewares/authorize'
import serverExists from '../middlewares/serverExists'

import { home, info } from './core'
import { create as userCreate, getSelf as userGetSelf, patch as userPatch, remove as userDelete } from './users'
import { post as messagePost } from './messages'
import { create as serverCreate, leave as serverLeave, remove as serverDelete } from './servers'
import { create as inviteCreate, accept as inviteAccept } from './invites'

const api = express.Router()
const notImplemented = (req, res) => res.status(501).json({ error: 'This feature is not implemented yet. Contribute to help us bring this feature faster! https://github.com/Union-Chat/Union-Server' })

// Middlewares
api.use(bodyParser.json())
api.use(bodyParser.urlencoded({ extended: true }))
api.use(allowCORS)

// Core
api.get('/', home)
api.get('/info', info)

// User
api.post('/users', userCreate)
api.get('/users/self', authorize, userGetSelf)
api.put('/users/self', authorize, userPatch)
api.patch('/users/self', authorize, userPatch)
api.delete('/users/self', authorize, userDelete)

// Server
api.post('/servers', authorize, serverCreate)
api.post('/servers/:serverId/messages', serverExists, authorize, messagePost)
api.delete('/servers/:serverId([0-9]+)/leave', authorize, serverExists, serverLeave)
api.delete('/servers/:serverId([0-9]+)', authorize, serverExists, serverDelete)

// Invites
api.post('/servers/:serverId([0-9]+)/invites', authorize, serverExists, inviteCreate)
api.post('/invites/:inviteId([a-zA-Z0-9-_]+)', authorize, inviteAccept)

// Developers
api.get('/developers/applications', notImplemented)
api.post('/developers/applications', notImplemented)

api.get('/developers/applications/:applicationId', notImplemented)
api.put('/developers/applications/:applicationId', notImplemented)
api.patch('/developers/applications/:applicationId', notImplemented)
api.delete('/developers/applications/:applicationId', notImplemented)

api.get('/oauth2/authorize', notImplemented)
api.post('/oauth2/token', notImplemented)
api.post('/oauth2/revoke', notImplemented)

export default api
