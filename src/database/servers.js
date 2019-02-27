/**
 * @typedef Server Represents an Union server
 * @property {ObjectId} _id Server ID
 * @property {String} name Server name
 * @property {ObjectId} owner Owner ID
 * @property {String} iconUrl Icon of the server
 * @property {Boolean|Null} admin Whether the user is an administrator
 */

/**
 * Servers model
 * @property {Database} db Instance of the database manager
 * @todo: Create/Get/Update/Delete channels (depends on channels impl)
 * @todo: Move message handling to channels
 * @todo: Manage invites
 * @todo: Roles & Permissions
 * @todo: Moderation (mute/kick/ban)
 * @todo: Audit logs
 */
class Servers {
  /**
   * Servers Model constructor
   * @param {Database} database Instance of the database manager
   */
  constructor (database) {
    this.db = database;
  }

  //*******************//
  // Server Management //
  //*******************//
  /**
   * Creates a server
   * @param {string} name Name of the server
   * @param {ObjectId} owner Owner of the server
   * @returns {Promise<Server>} The created server
   */
  async create (name, owner) {
    const wr = await this.db.mongo.servers.insertOne({ name, owner });
    return await this.db.mongo.servers.findOne({ _id: wr._id });
  }

  /**
   * Finds a server
   * @param {ObjectId} _id Server ID
   * @returns {Promise<Server|Null>} The resolved server, if found
   */
  find (_id) {
    return this.db.mongo.servers.findOne({ _id });
  }

  /**
   * Updates a server
   * @param {ObjectId} _id Server ID
   * @param {object} update Fields to update. Can be partial
   * @returns {Promise<Server|Null>} The updated server, if exists
   */
  update (_id, update) {
    return this.db.mongo.servers.findAndModify({
      query: { _id },
      new: true,
      update
    });
  }

  /**
   * Deletes a server
   * @param _id Server ID
   * @returns {Promise<void>}
   */
  async delete (_id) {
    await this.db.mongo.servers.remove({ _id });
  }

  //*********//
  // Members //
  //*********//
  /**
   * Gets all members the server has
   * @param {ObjectId} _id Server ID
   * @returns {Promise<Array<User>>}
   */
  async findUsers (_id) {
    return this.db.mongo.users.findOne({ servers: { $in: [ _id ] } });
  }
}

module.exports = Servers;
