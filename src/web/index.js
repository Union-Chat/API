const https = require('https');
const express = require('express');
const { readFile } = require('fs').promises;

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
   * @returns Promise<Void>
   */
  async startServer () {
    this._setup();
    if (App.getInstance().config.certs) {
      try {
        const opts = {
          cert: await readFile(App.getInstance().config.certs.cert),
          key: await readFile(App.getInstance().config.certs.key)
        };

        // noinspection JSCheckFunctionSignatures - jetbrains small brain
        const httpsServer = https.createServer(opts, this.app);
        httpsServer.listen(App.getInstance().config.ports.web);
      } catch (e) {
        console.error('Failed to start HTTP server!', e);
        process.exit(-1);
      }
    } else {
      this.app.listen(App.getInstance().config.ports.web);
    }
  }

  /**
   * Initializes Express middleware and routes
   * @private
   */
  _setup () {
    // API
    this.app.use(Middlewares.blockBanned);
    this.app.use(Middlewares.globalRateLimit());

    this.app.use('/', v2);
    this.app.use('/v2', v2);
  }
}

module.exports = Web;
