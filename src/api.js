import express from 'express'
import v2 from './api'

const api = express.Router()

api.use('/', v2)
api.use('/v2', v2)

export default api
