const fs = require('fs');
const url = require('url');
const http = require('http');
const https = require('https');
const shortid = require('shortid');
const WebSocket = require('ws');

const App = require('../app');
const Middlewares = require('../web/middlewares');
const Dispatcher = require('./dispatcher');
const Receiver = require('./receiver');

/**
 * @typedef UnionClient
 * @property {string} id Unique ID associated with the socket
 * @property {WebSocket} ws WebSocket instance
 * @property {int} version Version of the socket the client understands
 * @property {User|Null} user Current user, if logged in
 * @property {Boolean} isAuthenticated Whether or not the user is authenticated
 * @property {Boolean} isAlive Whether or not the socket is alive
 * @property {Array<String>} subscriptions List of events the user is subscribed to
 */

/**
 * Union WebSocket manager
 * @property {Server} HTTP server running the ws
 * @property {WebSocket.Server} WebSocket instance
 * @property {Array<UnionClient>} Clients connected to the ws
 */
class Socket {
  constructor () {
    this.server = process.argv.includes('--use-insecure-ws') || process.argv.includes('--use-insecure')
      ? http.createServer()
      : https.createServer({
        cert: fs.readFileSync(App.getInstance().config.certs.ws.cert),
        key: fs.readFileSync(App.getInstance().config.certs.ws.key)
      });

    this.socket = new WebSocket.Server({ server: this.server });
    this.clients = [];
  }

  /**
   * Initializes and launches the socket server
   */
  startSocket () {
    this.socket.on('connection', this._connection.bind(this));

    this.server.listen(App.getInstance().config.ports.ws, () => {
      setInterval(() => {
        this.clients.forEach(async client => {
          if (client.ws.readyState === WebSocket.CLOSING || client.ws.readyState === WebSocket.CLOSED) {
            return;
          }

          if (!client.isAlive) {
            // await handlePresenceUpdate(ws.user.id, socket.clients);
            this.clients = this.clients.filter(c => c.id !== client.id);
            return client.ws.terminate();
          }

          client.isAlive = false;
          Dispatcher.heartbeat(client);
        });
      }, 30e3);
    });
  }

  /**
   * Gets all clients authenticated as a specific user
   * @param {ObjectId} id User ID
   * @returns {Array<UnionClient>}
   */
  getClientsByUserID (id) {
    return this.clients.filter(c => c.user && c.user._id === id);
  }

  /**
   * Gets all clients that can see a server
   * @param {ObjectId} id Server ID
   * @returns {Array<UnionClient>}
   */
  getClientsByServerID (id) {
    return this.clients.filter(c => c.user && c.user.servers && c.user.servers.find(s => s === id));
  }

  /**
   * Gets all clients that are at least one server
   * @param {Array<ObjectId>} servers Servers ID
   * @returns {Array<UnionClient>}
   */
  getClientsByServersID (servers) {
    const clients = [];
    servers.forEach(server => clients.push(this.getClientsByServerID(server)));
    return [ ...new Set(clients.reduce((a, b) => [ ...a, ...b ], [])) ];
  }

  /**
   * Handles an incoming connection
   * @param {WebSocket} ws The client attempting to connect
   * @param {Request} req The associated HTTP request
   * @returns {Promise<void>}
   * @private
   */
  async _connection (ws, req) {
    // hahayes
    const fakeRes = { sendStatus: () => ws.close(4007, 'You\'ve been banned') };
    Middlewares.blockBanned(req, fakeRes, () => {
      const query = url.parse(req.url, true).query;
      const version = parseInt(query.version || 2);
      if (![ 2 ].includes(version)) {
        ws.close(4000, 'Invalid socket version provided');
      }

      const id = shortid();
      const client = {
        id,
        ws,
        version,
        user: null,
        isAlive: true,
        isAuthenticated: false,
        subscriptions: Dispatcher.V2_EVENTS
      };

      ws.on('message', (data) => Receiver(client, data));
      ws.on('close', () => this._close(client));

      this.clients.push(client);
      Dispatcher.welcome(client);

      setTimeout(() => {
        if (!client.user && client.readyState !== WebSocket.CLOSED) {
          client.close(4001, 'Authentication timed out');
        }
      }, 30e3);
    });
  }

  /**
   * Handles a client disconnecting from the socket
   * @param {UnionClient} client The client disconnecting
   * @private
   */
  _close (client) {
    this.clients = this.clients.filter(c => c.id !== client.id);
    if (client.isAuthenticated && 0 === this.getClientsByUserID(client.user._id).length) {
      App.getInstance().db.presences.setPresence(client.user._id, false);
      const clients = this.getClientsByServersID(client.user.servers).filter(c => c.user._id !== client.user._id);
      Dispatcher.presenceUpdate(clients, {
        user: client.user._id,
        online: false
      });
    }
  }
}

module.exports = Socket;
