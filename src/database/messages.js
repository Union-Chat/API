/**
 * @typedef Message Represents a message posted on Union
 * @property {ObjectId} _id Message ID
 * @property {String} username Username of the user
 * @property {String} password Hashed password of the user
 * @property {String} discriminator Discriminator of the user
 * @property {Array<ObjectId>|Null} servers An array of server IDs the user is in
 * @property {Boolean|Null} admin Whether the user is an administrator
 */

/**
 * Messages model
 * @property {Database} db Instance of the database manager
 * @todo: Advanced fetching (Arround #id, in channel, searching?)
 * @todo: Reaction
 * @todo: Snipes
 * @todo: Embeds/Integrated messages (Reddit/Twitter/GitHub/...)
 */
class Messages {
  /**
   * Messages Model constructor
   * @param {Database} database Instance of the database manager
   */
  constructor (database) {
    this.db = database;
  }

  /**
   * Creates a message
   * @param {ObjectId} author Author of the message
   * @param {ObjectId} server Server the message belongs to
   * @param {string} contents Contents of the message
   * @returns {Promise<Message>} The created message
   */
  async create (author, server, contents) {
    const wr = await this.db.mongo.messages.insertOne({ author, server, contents });
    return await this.db.mongo.messages.findOne({ _id: wr._id });
  }

  /**
   * Fetches a message
   * @param {ObjectId} _id Message ID
   * @param {ObjectId} server Server the message belongs to
   * @returns {Promise<Message|Null>} The message, if found
   */
  find (_id, server) {
    return this.db.mongo.messages.findOne({ _id, server });
  }

  /**
   * Edits a message
   * @param {ObjectId} _id Server ID
   * @param {object} update Fields to update. Can be partial
   * @returns {Promise<Server|Null>} The updated message, if exists
   */
  update (_id, update) {
    return this.db.mongo.messages.findAndModify({
      query: { _id },
      new: true,
      update
    });
  }

  /**
   * Deletes a message
   * @param _id Server ID
   * @returns {Promise<void>}
   */
  async delete (_id) {
    await this.db.mongo.servers.remove({ _id });
  }
}

module.exports = Messages;
