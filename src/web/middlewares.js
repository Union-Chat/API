const RateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const crypto = require('crypto');

const App = require('../app');

/**
 * Express middlewares
 */
class Middlewares {
  /**
   * Creates the global rate limit middleware
   * @return {RateLimit} RateLimit middleware ready to use
   */
  static globalRateLimit () {
    return new RateLimit({
      max: 500,
      windowMs: 50000,
      store: new RedisStore({
        prefix: 'RateLimit:',
        client: App.getInstance().redis.redis
      }),
      keyGenerator: req => Middlewares._computeIp(req, 'Global:'),
      handler: Middlewares._handleGlobalRL
    });
  }

  /**
   * Creates a rate limit middleware
   * @return {RateLimit} RateLimit middleware ready to use
   */
  static rateLimit () {
    return new RateLimit({
      max: 5,
      windowMs: 1000,
      store: new RedisStore({
        prefix: 'RateLimit:',
        client: App.getInstance().redis.redis
      }),
      keyGenerator: req => Middlewares._computeIp(req, `${req.originalUrl}:`)
    });
  }

  /**
   * Checks if an user is banned from the API
   * @param {Request} req Client request
   * @param {Response} res Client response
   * @param {Function} next Function to pass request to next middleware
   */
  static blockBanned (req, res, next) {
    const ip = Middlewares._computeIp(req);
    if (!!App.getInstance().redis.get(`RateLimit:Banned:${ip}`)) {
      return res.sendStatus(403);
    }
    next();
  }

  /**
   * Appends CORS headers to the response
   * @param {Request} req Client request
   * @param {Response} res Client response
   * @param {Function} next Function to pass request to next middleware
   */
  static cors (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
  }

  /**
   * Checks if an user is authenticated
   * @param {Request} req Client request
   * @param {Response} res Client response
   * @param {Function} next Function to pass request to next middleware
   */
  static async authenticate (req, res, next) {
    if (!req.headers.authorization) {
      return res.sendStatus(401);
    }

    const user = Middlewares.validate(req.headers.authorization);
    if (!user) {
      return res.sendStatus(401);
    }

    req.user = user;
    next();
  }

  /**
   * Checks if a server exists
   * @param {Request} req Client request
   * @param {Response} res Client response
   * @param {Function} next Function to pass request to next middleware
   */
  static serverExists (req, res, next) {
    const { serverId } = req.params;

    if (!App.getInstance().db.servers.find(serverId)) {
      return res.status(404).json({
        status: 404,
        error: 'This server does not exists'
      });
    }

    req.serverId = serverId;
    next();
  }

  /**
   * Validates a token
   * @param {string} token The token to validate
   * @returns {User|Null} The user if the token is valid, else null
   */
  static async validate (token) {
    const [ type, creds ] = token.split(' ');
    if (!creds) {
      return null;
    }

    // For now only Basic is supported, but that'll change in the future. Valid tokens will be "User", "Bot" and "Bearer"
    switch (type) {
      case 'Basic':
        const [ uniontag, password ] = Buffer.from(creds, 'base64').toString().split(':');

        if (!uniontag || !password) {
          return res.sendStatus(401);
        }

        return await App.getInstance().db.users.findWithCredentials(uniontag, password);
      default:
        return null;
    }
  }

  /**
   * Handles global rate limit
   * @param {Request} req Client request
   * @param {Response} res Client response
   * @private
   */
  static _handleGlobalRL (req, res) {
    const ip = Middlewares._computeIp(req);
    App.getInstance().redis.set(`RateLimit:Banned:${ip}`, 'yes');
    res.status(429).send('You\'ve been banned from the API for 5 minutes due to abuse');
  }

  /**
   * Gets a hash of the IP address
   * @param {Request} req Client request
   * @param {string} suffix Suffix for the key, optional
   * @returns {string} The hashed IP address
   * @private
   */
  static _computeIp (req, suffix = '') {
    const shasum = crypto.createHash('sha1');
    shasum.update(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    return suffix + shasum.digest('hex');
  }
}

module.exports = Middlewares;
