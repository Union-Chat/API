import express from 'express'
import bodyParser from 'body-parser'

import allowCORS from '../middlewares/cors'
import authorize from '../middlewares/authorize'
import serverExists from '../middlewares/serverExists'

import { home, info } from './core'
import { create as userCreate } from './users'
import { create as serverCreate, leave as serverLeave, remove as serverDelete } from './servers'

const api = express.Router()

// Middlewares
api.use(bodyParser.json())
api.use(bodyParser.urlencoded({ extended: true }))
api.use(allowCORS)

// Core
api.get('/', home)
api.get('/info', info)

// User
api.post('/users/create', userCreate)

// Server
api.post('/servers/create', authorize, serverCreate)
api.delete('/servers/:serverId([0-9]+)/leave', authorize, serverExists, serverLeave)
api.delete('/servers/:serverId([0-9]+)', authorize, serverExists, serverDelete)

export default api
