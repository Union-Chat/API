import crypto from 'crypto';
import express from 'express';
import RateLimit from 'express-rate-limit';
import banned from './middlewares/banned';
import v2 from './api/index';

const api = express.Router();
global.bannedIps = [];

api.use(banned);
api.use(new RateLimit({
  keyGenerator: req => {
    const shasum = crypto.createHash('sha1');
    shasum.update(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    return `Global:${shasum.digest('hex')}`;
  },
  windowMs: 50000,
  max: 500,
  handler: (req, res) => {
    const shasum = crypto.createHash('sha1');
    shasum.update(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    const ip = shasum.digest('hex');
    if (!global.bannedIps.includes(ip)) { // We should not need to check but never too prudent
      global.bannedIps.push(ip);
      setTimeout(() => {
        global.bannedIps = global.bannedIps.filter(bip => bip !== ip);
      }, 300e3);
    }
    res.status(429).send('You\'ve been banned from the API for 5 minutes due to abuse');
  }
}));

api.use('/', v2);
api.use('/v2', v2);

export default api;
