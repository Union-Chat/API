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
    App.instance = this;

    // Even if it's ugly, we require files only here to prevent cyclic dependencies and weird bugs like empty objects.
    // @see https://nodejs.org/api/modules.html
    const Config = require('./config');
    this.config = new Config();

    const Database = require('./database');
    this.db = new Database();

    const Redis = require('./redis');
    this.redis = new Redis();

    const Web = require('./web');
    this.web = new Web();

    const Socket = require('./socket');
    this.socket = new Socket();
  }

  async start () {
    console.log('Connecting to Mongo...');
    await this.db.connectToDB();

    console.log('Starting Express server...');
    await this.web.startServer();

    // @todo: Move that to Union-Socket
    console.log('Starting WebSocket...');
    this.socket.startSocket();

    console.log('Union API successfully launched!');
  }

  /**
   * Returns an instance of the App. App is a singleton
   * @returns {App} The instance of the app
   */
  static getInstance () {
    if (!App.instance) {
      new App();
    }
    return App.instance;
  }
}

module.exports = App;
