const { resolve } = require('path');
const express = require('express');

const App = require('../app');
const v2 = require('./v2');
const Middlewares = require('./middlewares');

/**
 * Union web server
 * @property {Server} app ExpressJS instance
 */
class Web {
  constructor () {
    this.app = express();
  }

  /**
   * Starts up Express server
   */
  startServer () {
    this._setupRoutes();
    this.app.listen(App.getInstance().config.ports.web);
  }

  /**
   * Initializes Express middleware and routes
   * @private
   */
  _setupRoutes () {
    // API
    this.app.use(Middlewares.blockBanned);
    this.app.use(Middlewares.globalRateLimit());

    this.app.use('/', v2);
    this.app.use('/v2', v2);
  }
}

module.exports = Web;
