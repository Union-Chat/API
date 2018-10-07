import express from 'express'
import v1 from './controllers/v1'
import v2 from './controllers/v2'

const api = express.Router()

api.use('/', v1)
api.use('/v2', v2)

export default api
