const { hash, compare } = require('bcrypt');

/**
 * @typedef User Represents an Union user
 * @property {ObjectId} _id User ID
 * @property {String} username Username of the user
 * @property {String} password Hashed password of the user
 * @property {String} discriminator Discriminator of the user
 * @property {Array<ObjectId>|Null} servers An array of server IDs the user is in
 * @property {Boolean|Null} admin Whether the user is an administrator
 */

/**
 * Users model
 * @property {Database} db Instance of the database manager
 * @todo: Create/Get DM channel (depends on channels impl)
 * @todo: Create/Get/Update/Delete relationships
 */
class Users {
  /**
   * Users Model constructor
   * @param {Database} database Instance of the database manager
   */
  constructor (database) {
    this.db = database;
  }

  //********************//
  // Account Management //
  //********************//
  /**
   * Creates a new user
   * @param {String} username The username of the new account
   * @param {String} password The password of the new account, even if we know this field is `password1`
   * @returns {Promise<User>} The created user
   */
  async create (username, password) {
    const discriminator = await this._rollDiscriminator(username);
    const wr = await this.db.mongo.users.insertOne({
      username,
      discriminator,
      password: await hash(password, 10)
    });
    return await this.db.mongo.users.findOne({ _id: wr._id });
  }

  /**
   * Finds an user
   * @param {ObjectId} _id User ID
   * @returns {Promise<User|Null>} The resolved user, if found
   */
  find (_id) {
    return this.db.mongo.users.findOne({ _id });
  }

  /**
   * Finds an user using credentials
   * @param {String} tag User's UnionTag (username#discrim)
   * @param {String} password The very secure `password1`
   * @returns {Promise<User|Null>} The resolved user, if credentials are valid
   */
  async findWithCredentials (tag, password) {
    const [ username, discriminator ] = tag.split('#');
    const user = await this.db.mongo.users.find({ username, discriminator });
    if (!user || !compare(password, user.password)) {
      return null;
    }
    return user;
  }

  /**
   * Updates an user
   * @param {ObjectId} _id User ID
   * @param {object} update Fields to update. Can be partial
   * @returns {Promise<User|Null>} The updated user, if exists
   */
  update (_id, update) {
    if (update.password) {
      update.password = hash(update.password, 10);
    }
    return this.db.mongo.users.findAndModify({
      query: { _id },
      new: true,
      update
    });
  }

  /**
   * Deletes an user
   * @param _id User ID
   * @returns {Promise<void>}
   */
  async delete (_id) {
    await this.db.mongo.users.remove({ _id });
  }

  //*********//
  // Servers //
  //*********//
  /**
   * Gets all servers the user is in
   * @param {ObjectId} _id User ID
   * @returns {Promise<Array<Server>>}
   */
  async findServers (_id) {
    const aggregation = await this.db.mongo.users.aggregate({
      pipeline: [
        { $match: { _id } },
        { $unwind: '$servers' },
        {
          $lookup: {
            from: 'servers',
            localField: 'servers',
            foreignField: '_id'
          }
        },
        { $group: { servers: '$servers' } }
      ]
    }).toArray();

    return aggregation.map(data => data.servers);
  }

  /**
   * Gets all servers the user owns
   * @param {ObjectId} _id User ID
   * @returns {Promise<Array<Server>>}
   */
  async findOwnedServers (_id) {
    const aggregation = await this.db.mongo.users.aggregate({
      pipeline: [
        { $match: { _id } },
        { $unwind: '$servers' },
        {
          $lookup: {
            from: 'servers',
            localField: 'servers',
            foreignField: '_id'
          }
        },
        { $match: { 'servers.owner': _id } },
        { $group: { servers: '$servers' } }
      ]
    }).toArray();

    return aggregation.map(data => data.servers);
  }

  /**
   * Checks if an user is in a server or not
   * @param {ObjectId} _id User ID
   * @param {ObjectId} serverId Server ID
   * @returns {Promise<Boolean>} If the user is in the server
   */
  async isInServer (_id, serverId) {
    return !!await this.db.mongo.users.findOne({
      _id,
      servers: { $in: [ serverId ] }
    });
  }

  /**
   * Checks if an user owns a server or not
   * @param {ObjectId} _id User ID
   * @param {ObjectId} serverId Server ID
   * @returns {Promise<Boolean>} If the user owns the server
   */
  async ownsServers (_id, serverId) {
    const server = await this.db.mongo.servers.findOne({ _id: serverId });
    return server.owner === _id;
  }

  /**
   * Makes an user join a server
   * @param {ObjectId} _id User ID
   * @param {ObjectId} serverId ID of the server the user is joining
   * @returns {Promise<User|Null>} The updated user, if exists
   */
  joinServer (_id, serverId) {
    return this.db.mongo.users.findAndModify({
      query: { _id },
      new: true,
      update: { $push: { servers: serverId } }
    });
  }

  /**
   * Makes an user leave a server
   * @param {ObjectId} _id User ID
   * @param {ObjectId} serverId ID of the server the user is leaving
   * @returns {Promise<User|Null>} The updated user, if exists
   */
  leaveServer (_id, serverId) {
    return this.db.mongo.users.findAndModify({
      query: { _id },
      new: true,
      update: { $pull: { servers: serverId } }
    });
  }

  //********************//
  // Internal Utilities //
  //********************//
  /**
   * Generates a random and unique discriminator for an user to allow multiple users having the same username
   * @param username Username that will be associated with the generated discriminator
   * @returns {Promise<string>} A 4-digit discriminator
   * @private
   */
  async _rollDiscriminator (username) {
    let discriminator;
    while (true) {
      discriminator = Math.floor(Math.random() * 9999 + 1).toString().padStart(4, '0');
      if (!await this.db.mongo.users.findOne({ username, discriminator })) {
        break;
      }
    }

    return discriminator;
  }
}

module.exports = Users;
