import express from 'express'
import bodyParser from 'body-parser'

import allowCORS from '../middlewares/cors'

import { home, info } from './core'
import { create as userCreate } from './users'

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

export default api
