const App = require('../app');

/**
 * @typedef Presence
 * @property {ObjectId} user User ID
 * @property {Boolean} online If the user is online or not
 */

/**
 * Presences model
 * @property {Database} db Instance of the database manager
 * @todo: Advanced invites (Expiration, limits, join tracking)
 * @todo: Get/Edit/Delete invites
 * @todo: Vanity urls
 */
class Presences {
  /**
   * Presences Model constructor
   * @param {Database} database Instance of the database manager
   */
  constructor (database) {
    this.db = database;
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Gets the presence of an user
   * @param {ObjectId} user User ID
   * @returns {Promise<Boolean>} If the user is online or not
   */
  async getPresence (user) {
    return await App.redis.getOrFetch(`Presences:${user}`, () => 'false', -1) === 'true';
  }

  /**
   * Gets all presences of a server
   * @param {ObjectId} server Server ID
   * @returns {Promise<Array<Presences>>} If the user is online or not
   */
  async getServerPresences (server) {
    const users = await this.db.servers.findUsers(server);
    return await Promise.all(users.map(user => new Promise(async res => {
      res({
        user: user._id,
        online: await this.getPresence(user._id)
      });
    })));
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Sets the presence of an user
   * @param {ObjectId} user User ID
   * @param {Boolean} online If the user is online or not
   */
  setPresence (user, online) {
    return App.redis.set(`Presences:${user}`, online.toString(), -1);
  }
}

module.exports = Presences;
