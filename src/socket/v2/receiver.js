const App = require('../../app');
const Middlewares = require('../../web/middlewares');
const opcodes = require('./opcodes');
const Dispatcher = require('./dispatcher');

/**
 * WebSocket v2 event receiver
 */
class Receiver {
  /**
   * Handles an incoming payload
   * @param {UnionClient} client The client who sent the payload
   * @param {object} payload The received payload
   */
  static async handle (client, payload) {
    if (data.op === undefined || data.d === undefined) {
      client.ws.close(4002, 'Malformed payload (missing op and/or data)');
    }

    switch (data.op) {
      case opcodes.Authenticate:
        await Receiver.authenticate(client, data.d);
        break;
      case opcodes.Subscribe:
        Receiver.subscribe(client, data.d);
        break;
      case opcodes.Unsubscribe:
        Receiver.unsubscribe(client, data.d);
        break;
      default:
        client.ws.close(4003, 'Unknown opcode. Please refer to the documentation for a list of opcodes');
        break;
    }
  }

  /**
   * Handles an authentication payload
   * @param {UnionClient} client The client attempting to authenticate
   * @param {string} data Authentication token
   * @returns {Promise<void>}
   */
  static async authenticate (client, data) {
    const user = await Middlewares.validate(data);
    if (!user) {
      client.ws.close(4001, 'Invalid credentials');
    }

    client.isAuthenticated = true;
    client.user = user;
    if (!App.getInstance().db.presences.getPresence(user._id)) {
      App.getInstance().db.presences.setPresence(user._id, true);
      App.getInstance().socket.getClientsByServersID(user.servers).filter(c => c.user._id !== user._id).forEach(c => {
        Dispatcher.presenceUpdate(c, {
          user: c.user._id,
          online: false
        });
      });
    }
    await Dispatcher.hello(client);
  }

  /**
   * Handles a subscribe payload
   * @param {UnionClient} client The client
   * @param {Array<string>} data Events the user is subscribing to
   */
  static subscribe (client, data) {
    if (0 === data.length) {
      client.subscriptions = Dispatcher.V2_EVENTS;
    } else {
      if (data.filter(d => -1 !== Dispatcher.V2_EVENTS.indexOf(d)).length !== data.length) {
        return client.ws.close(4002, 'You passed an invalid event');
      }
      client.subscriptions = [ ...new Set(data) ];
    }
  }

  /**
   * Handles a unsubscribe payload
   * @param {UnionClient} client The client
   * @param {Array<string>} data Events the user is un-subscribing to
   */
  static unsubscribe (client, data) {
    if (0 === data.length) {
      client.subscriptions = [];
    } else {
      if (data.filter(d => -1 !== Dispatcher.V2_EVENTS.indexOf(d)).length !== data.length) {
        return client.ws.close(4002, 'You passed an invalid event');
      }
      client.subscriptions = client.subscriptions.filter(s => -1 === data.indexOf(s));
    }

    if (0 === client.subscriptions.length) {
      setTimeout(() => {
        if (0 === client.subscriptions.length) {
          client.ws.close(4006, 'You\'re not subscribed to anything for too long');
        }
      }, 30e3);
    }
  }
}

module.exports = Receiver;
