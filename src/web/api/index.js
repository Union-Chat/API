const express  = require('express');

const v2 = require('./v2');
const Middlewares = require('../middlewares');

const api = express.Router();

api.use(Middlewares.blockBanned);
api.use(Middlewares.globalRateLimit());

api.use('/', v2);
api.use('/v2', v2);

module.exports = api;
