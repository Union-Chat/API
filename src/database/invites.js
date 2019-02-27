/**
 * @typedef Invite Represents an invitation to join a server
 * @property {ObjectId} _id Invitation ID
 * @property {String} link Invite code
 * @property {ObjectId} server Server the invite belongs to
 */

/**
 * Invites model
 * @property {Database} db Instance of the database manager
 * @todo: Advanced invites (Expiration, limits, join tracking)
 * @todo: Get/Edit/Delete invites
 * @todo: Vanity urls
 */
class Invites {
  /**
   * Invites Model constructor
   * @param {Database} database Instance of the database manager
   */
  constructor (database) {
    this.db = database;
  }

  /**
   * Creates an invite
   * @param {ObjectId} server Server the invite belongs to
   * @returns {Promise<Invite>} The created message
   */
  async create (server) {
    const wr = await this.db.mongo.invites.insertOne({ server });
    return await this.db.mongo.invites.findOne({ _id: wr._id });
  }

  /**
   * Finds an invite
   * @param {ObjectId} _id Invite ID
   * @returns {Promise<Invite|Null>} The resolved invite, if found
   */
  find (_id) {
    return this.db.mongo.invites.findOne({ _id });
  }
}

module.exports = Invites;
