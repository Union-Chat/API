const App = require('../../app');
const opcodes = require('./opcodes');

/**
 * WebSocket v2 event dispatcher
 */
class Dispatcher {
  //**************//
  //* Core stuff *//
  //**************//
  /**
   * Sends a welcome payload to a client
   * @param {UnionClient} client The client
   */
  static welcome (client) {
    client.ws.send(JSON.stringify({ op: opcodes.Welcome }));
  }

  /**
   * Says hello to a client
   * @param {UnionClient} client The client
   */
  static async hello (client) {
    const servers = await App.getInstance().db.users.findServers(client.user._id);
    const presences = {};
    await Promise.all(servers.map(server => new Promise(async res => {
      presences[server._id] = await App.getInstance().db.presences.getServerPresences(server._id);
      res();
    })));

    client.ws.send(JSON.stringify({
      op: opcodes.Hello, d: {
        servers,
        presences
      }
    }));
  }

  /**
   * Sends a heartbeat payload to a client
   * @param {UnionClient} client The client
   */
  static heartbeat (client) {
    client.ws.send(JSON.stringify({ op: opcodes.Heartbeat }));
  }

  /**
   * Sends a ok payload to a client
   * @param {UnionClient} client The client
   */
  static ok (client) {
    client.ws.send(JSON.stringify({ op: opcodes.OK }));
  }

  //***************//
  //* User Events *//
  //***************//
  /**
   * Dispatches a user update event
   * @param {UnionClient} client The client
   * @param {Presence} presence The presence to dispatch
   */
  static presenceUpdate (client, presence) {
    Dispatcher._dispatchEvent(client, JSON.stringify({
      op: opcodes.DispatchEvent,
      e: 'PRESENCE_UPDATE',
      d: presence
    }));
  }
  /**
   * Dispatches a user update event
   * @param {UnionClient} client The client
   * @param {User} user The up to date user
   */
  static userUpdate (client, user) {
    Dispatcher._dispatchEvent(client, JSON.stringify({
      op: opcodes.DispatchEvent,
      e: 'USER_UPDATE',
      d: user
    }));
  }

  //*****************//
  //* Server Events *//
  //*****************//
  /**
   * Dispatches a server create event
   * @param {UnionClient} client The client
   * @param {Server} server The created server
   */
  static serverCreate (client, server) {
    Dispatcher._dispatchEvent(client, JSON.stringify({
      op: opcodes.DispatchEvent,
      e: 'SERVER_CREATE',
      d: server
    }));
  }

  /**
   * Dispatches a server update event
   * @param {UnionClient} client The client
   * @param {Server} server The updated server
   */
  static serverUpdate (client, server) {
    Dispatcher._dispatchEvent(client, JSON.stringify({
      op: opcodes.DispatchEvent,
      e: 'SERVER_UPDATE',
      d: server
    }));
  }

  /**
   * Dispatches a server member join event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {ObjectId} server Server ID the user is joining
   * @param {ObjectId} user User ID
   */
  static serverMemberJoin (client, server, user) {
    Dispatcher._dispatchEvent(client, JSON.stringify({
      op: opcodes.DispatchEvent,
      e: 'SERVER_MEMBER_JOIN',
      d: { server, user }
    }));
  }

  /**
   * Dispatches a server member leave event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {ObjectId} server Server ID the user is leaving
   * @param {ObjectId} user User ID
   */
  static serverMemberLeave (client, server, user) {
    Dispatcher._dispatchEvent(client, JSON.stringify({
      op: opcodes.DispatchEvent,
      e: 'SERVER_MEMBER_LEAVE',
      d: { server, user }
    }));
  }

  /**
   * Dispatches a server delete event
   * @param {UnionClient} client The client
   * @param {ObjectId} server The deleted server ID
   */
  static serverDelete (client, server) {
    Dispatcher._dispatchEvent(client, JSON.stringify({
      op: opcodes.DispatchEvent,
      e: 'SERVER_UPDATE',
      d: server
    }));
  }

  //******************//
  //* Message Events *//
  //******************//
  /**
   * Dispatches a message create event
   * @param {UnionClient} client The client
   * @param {Message} message Created message
   */
  static messageCreate (client, message) {
    Dispatcher._dispatchEvent(client, JSON.stringify({
      op: opcodes.DispatchEvent,
      e: 'MESSAGE_CREATE',
      d: message
    }));
  }

  /**
   * Dispatches a message update event
   * @param {UnionClient} client The client
   * @param {Message} message Updated message
   */
  static messageUpdate (client, message) {
    Dispatcher._dispatchEvent(client, JSON.stringify({
      op: opcodes.DispatchEvent,
      e: 'MESSAGE_UPDATE',
      d: message
    }));
  }

  /**
   * Dispatches a message delete event
   * @param {UnionClient} client The client
   * @param {Message} message Deleted message ID
   */
  static messageDelete (client, message) {
    Dispatcher._dispatchEvent(client, JSON.stringify({
      op: opcodes.DispatchEvent,
      e: 'MESSAGE_DELETE',
      d: message
    }));
  }

  //******************//
  //* Internal utils *//
  //******************//
  /**
   * Dispatches an event if the client is subscribed to the event
   * @param {UnionClient} client The client the event will be dispatched to
   * @param {object} event The event to dispatch
   * @private
   */
  static _dispatchEvent (client, event) {
    if (client.subscriptions.includes(event.e)) {
      client.ws.send(event);
    }
  }
}

module.exports = Dispatcher;
