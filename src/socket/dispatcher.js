const { Dispatcher: DispatcherV2 } = require('./v2');

/**
 * Global WebSocket event dispatcher
 * @property {Array<String>} V2_EVENTS List of v2 events
 */
class Dispatcher {
  //**************//
  //* Core stuff *//
  //**************//
  /**
   * Says hello to a client
   * @param {UnionClient} client The client
   */
  static hello (client) {
    switch (client.version) {
      case 2:
        DispatcherV2.hello(client);
    }
  }

  /**
   * Sends welcome payload to a client
   * @param {UnionClient} client The client
   */
  static welcome (client) {
    switch (client.version) {
      case 2:
        DispatcherV2.welcome(client);
    }
  }

  /**
   * Sends a heartbeat payload to a client
   * @param {UnionClient} client The client
   */
  static heartbeat (client) {
    switch (client.version) {
      case 2:
        DispatcherV2.heartbeat(client);
    }
  }

  /**
   * Sends a ok payload to a client
   * @param {UnionClient} client The client
   */
  static ok (client) {
    switch (client.version) {
      case 2:
        DispatcherV2.ok(client);
    }
  }

  //***************//
  //* User Events *//
  //***************//
  /**
   * Dispatches a presence update event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {Presence} presence The presence to dispatch
   */
  static presenceUpdate (client, presence) {
    if (Array.isArray(client)) {
      return client.forEach(c => Dispatcher.presenceUpdate(c, presence));
    }
    switch (client.version) {
      case 2:
        DispatcherV2.presenceUpdate(client, presence);
    }
  }

  /**
   * Dispatches a user update event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {User} user The up to date user
   */
  static userUpdate (client, user) {
    if (Array.isArray(client)) {
      return client.forEach(c => Dispatcher.userUpdate(c, user));
    }
    App.getInstance().socket.refreshUser(user._id);
    switch (client.version) {
      case 2:
        DispatcherV2.userUpdate(client, user);
    }
  }

  //*****************//
  //* Server Events *//
  //*****************//
  /**
   * Dispatches a server create event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {Server} server The created server
   */
  static serverCreate (client, server) {
    if (Array.isArray(client)) {
      return client.forEach(c => Dispatcher.serverCreate(c, server));
    }
    switch (client.version) {
      case 2:
        DispatcherV2.serverCreate(client, server);
    }
  }

  /**
   * Dispatches a server update event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {Server} server The updated server
   */
  static serverUpdate (client, server) {
    if (Array.isArray(client)) {
      return client.forEach(c => Dispatcher.serverUpdate(c, server));
    }
    switch (client.version) {
      case 2:
        DispatcherV2.serverUpdate(client, server);
    }
  }

  /**
   * Dispatches a server member join event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {ObjectId} server Server ID the user is joining
   * @param {User} user User
   */
  static serverMemberJoin (client, server, user) {
    if (Array.isArray(client)) {
      return client.forEach(c => Dispatcher.serverMemberJoin(c, server, user));
    }
    App.getInstance().socket.refreshUser(user._id);
    switch (client.version) {
      case 2:
        DispatcherV2.serverMemberJoin(client, server, user);
    }
  }

  /**
   * Dispatches a server member leave event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {ObjectId} server Server ID the user is leaving
   * @param {ObjectId} user User ID
   */
  static serverMemberLeave (client, server, user) {
    if (Array.isArray(client)) {
      return client.forEach(c => Dispatcher.serverMemberLeave(c, server, user));
    }
    App.getInstance().socket.refreshUser(user);
    switch (client.version) {
      case 2:
        DispatcherV2.serverMemberLeave(client, server, user);
    }
  }

  /**
   * Dispatches a server delete event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {ObjectId} server The deleted server ID
   */
  static serverDelete (client, server) {
    if (Array.isArray(client)) {
      return client.forEach(c => Dispatcher.serverDelete(c, server));
    }
    switch (client.version) {
      case 2:
        DispatcherV2.serverDelete(client, server);
    }
  }

  //******************//
  //* Message Events *//
  //******************//
  /**
   * Dispatches a message create event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {Message} message Created message
   */
  static messageCreate (client, message) {
    if (Array.isArray(client)) {
      return client.forEach(c => Dispatcher.messageCreate(c, server));
    }
    switch (client.version) {
      case 2:
        DispatcherV2.messageCreate(client, server);
    }
  }

  /**
   * Dispatches a message update event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {Message} message Updated message
   */
  static messageUpdate (client, message) {
    if (Array.isArray(client)) {
      return client.forEach(c => Dispatcher.messageUpdate(c, server));
    }
    switch (client.version) {
      case 2:
        DispatcherV2.messageUpdate(client, server);
    }
  }

  /**
   * Dispatches a message delete event
   * @param {UnionClient|Array<UnionClient>} client Client(s)
   * @param {Message} message Deleted message ID
   */
  static messageDelete (client, message) {
    if (Array.isArray(client)) {
      return client.forEach(c => Dispatcher.messageDelete(c, server));
    }
    switch (client.version) {
      case 2:
        DispatcherV2.messageDelete(client, server);
    }
  }
}

Dispatcher.V2_EVENTS = [
  'USER_UPDATE', 'PRESENCE_UPDATE', 'SERVER_CREATE', 'SERVER_UPDATE', 'SERVER_DELETE', 'SERVER_MEMBER_JOIN',
  'SERVER_MEMBER_LEAVE', 'MESSAGE_CREATE', 'MESSAGE_UPDATE', 'MESSAGE_DELETE'
];

module.exports = Dispatcher;
