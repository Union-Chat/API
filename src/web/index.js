const { resolve } = require('path');
const express = require('express');

const App = require('../app');

/**
 * Union web server
 * @property {Server} app ExpressJS instance
 */
class Web {
  constructor () {
    this.app = express();
  }

  startServer () {
    this._setupRoutes();
    this.app.listen(App.getInstance().config.ports.web);
  }

  _setupRoutes () {
    // API

    // UI Routes
    this.app.use('/dist', express.static(`${__dirname}/../dist`));
    this.app.get('*', (req, res) => res.sendFile(resolve(__dirname, '../../index.html')));
  }
}

module.exports = Web;
