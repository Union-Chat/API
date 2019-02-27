const prompt = require('prompt');
const { hash } = require('bcrypt');
const { MongoClient } = require('mongodb');

const Users = require('./users');
const Presences = require('./presences');
const Servers = require('./servers');
const Messages = require('./messages');
const Invites = require('./invites');

/**
 * @typedef MongoInstance An instance of Mongo
 * @property users {Collection} Users table
 * @property servers {Collection} Servers table
 * @property channels {Collection} Channels table
 * @property invites {Collection} Invites table
 * @property messages {Collection} Messages table
 * @property themes {Collection} Themes table
 * @property applications {Collection} Applications table
 */

/**
 * Database manager object
 * @property {MongoInstance} mongo The instance of Mongo
 * @property {Users} users Users model instance
 * @property {Presences} presences Presences model instance
 * @property {Servers} servers Servers model instance
 * @property {undefined} channels Channels model instance
 * @property {Messages} messages Messages model instance
 * @property {Invites} invites Invites model instance
 * @property {undefined} themes Themes model instance
 * @property {undefined} applications Applications model instance
 */
class Database {
  constructor () {
    this.users = new Users(this);
    this.presences = new Presences(this);
    this.servers = new Servers(this);
    this.messages = new Messages(this);
    this.invites = new Invites(this);
  }

  /**
   * Initialize connection to MongoDB
   * @returns {Promise<void>}
   */
  async connectToDB () {
    this.mongo = await MongoClient
      .connect('mongodb://localhost:27017', { useNewUrlParser: true })
      .then(client => client.db('union'))
      .then(async db => {
        const collections = await db.listCollections().toArray();
        if (!collections.find(c => 'users' === c.name)) {
          await this._setupRoot(db);
        }

        return {
          users: await db.collection('users'),
          servers: await db.collection('servers'),
          channels: await db.collection('channels'),
          invites: await db.collection('invites'),
          messages: await db.collection('messages'),
          themes: await db.collection('themes'),
          applications: await db.collection('applications')
        };
      })
      .catch(err => {
        console.error('Failed to connect to MongoDB!');
        console.error(err);
        process.exit(1);
      });
  }

  /**
   * Creates the root user, and prompt the user about username/password
   * @param {Db} db Raw mongo database instance
   * @returns {Promise<any>}
   * @private
   */
  _setupRoot (db) {
    return new Promise(res => {
      prompt.start();
      prompt.message = '';
      prompt.delimiter = '';
      console.log(' > Choose credentials for root account');
      prompt.get({
        properties: {
          username: {
            pattern: /^[a-zA-Z0-9\s\-_]+$/,
            default: 'root'
          },
          password: {
            default: 'root',
            hidden: true,
            replace: '*'
          }
        }
      }, async (err, results) => {
        const collection = await db.collection('users');
        await collection.insertOne({
          username: results.username,
          discriminator: '0001',
          password: await hash(results.password, 10),
          admin: true
        });
        console.log(' > Credentials for root user saved! Discriminator is 0001');
        prompt.stop();
        res();
      });
    });
  }
}

module.exports = Database;
