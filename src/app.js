/**
 * Union App
 * @property {Config} config Union configuration manager
 * @property {Database} db Instance of database manager
 * @property {Web} web Instance of the web manager
 * @property {Socket} socket Instance of the socket manager
 * @property {Redis} redis Instance of Redis
 */
class App {
  constructor () {
    // @see https://nodejs.org/api/modules.html
    // Even if it's ugly, we require files only here to prevent cyclic dependencies and weird bugs like empty objects.
    const Database = require('./database');
    const Redis = require('./redis');
    const Config = require('./config');
    const Web = require('./web');
    const Socket = require('./socket');

    this.config = new Config();
    this.db = new Database();
    this.web = new Web();
    this.socket = new Socket();
    this.redis = new Redis();
  }

  async start () {
    console.log('Connecting to Mongo...');
    await this.db.connectToDB();

    console.log('Starting HTTP server...');
    this.web.startServer();

    console.log('Starting WebSocket...');
    this.socket.startSocket();

    console.log('Union successfully launched!');
  }

  /**
   * Returns an instance of the App. App is a singleton
   * @returns {App} The instance of the app
   */
  static getInstance () {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }
}

module.exports = App;
