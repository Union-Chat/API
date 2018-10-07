import express from 'express'
import v1 from './api_v1'
import v2 from './api_v2'

const api = express.Router()

api.use('/', v1)
api.use('/v2', v2)

export default api
