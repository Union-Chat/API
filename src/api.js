import RateLimit from 'express-rate-limit';
import express from 'express';
import banned from './middlewares/banned';
import v2 from './api/index';

const api = express.Router();
global.bannedIps = [];

api.use(banned);
api.use(new RateLimit({
  keyGenerator: req => req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
  windowMs: 1000,
  max: 500,
  handler: (req, res) => {
    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!global.bannedIps.includes(ip)) { // We should not need to check but never too prudent
      global.bannedIps.push(ip);
    }
    res.sendStatus(429).send('You\'ve been banned from the API for 5 minutes due to abuse');
  }
}));

api.use('/', v2);
api.use('/v2', v2);

export default api;
