const { hash, compare } = require('bcrypt');
const shortId = require('shortid');
const flakeId = require('flakeid');

const r = require('rethinkdbdash')({
  db: 'union'
});

const idGenerator = new flakeId({
  timeOffset: (2018 - 1970) * 31536000 * 1000
});


/**
 * Creates a user object with the provided username and password, and stores it in the DB
 * @param {String} username The username of the account to create
 * @param {String} password The password of the account to create
 */
async function createUser (username, password) {
  await r.table('users').insert({
    id: idGenerator.gen(),
    username,
    password: await hash(password, 10),
    createdAt: Date.now(),
    servers: [],
    online: false
  });
}


/**
 * Creates a server with the provided name and iconUrl
 * @param {String} name The name of the server
 * @param {String} iconUrl A URL leading to an image to be used as the server's icon
 * @returns {Object} The created server
 */
async function createServer (name, iconUrl, owner) {
  const server = {
    id: idGenerator.gen(),
    name,
    iconUrl,
    owner
  };

  await r.table('servers').insert(server);
  await addMemberToServer(owner, id);
  return getServer(id);
}


/**
 * Adds a member to a server
 * @param {String} username The member to add to the server
 * @param {Number} id The server to add the member to
 */
async function addMemberToServer (username, id) {
  const user = await r.table('users').get(username);
  const server = await r.table('servers').get(id);

  if (!user || !server || user.servers.includes(id)) {
    return;
  }

  await r.table('users').get(username).update({
    servers: r.row('servers').append(id)
  });
}


/**
 * Validates username and password from the provided auth
 * @param {String} auth The authentication type + base64-encoded credentials
 * @returns {(Null|Object)} The user object if authentication was successful, otherwise null
 */
async function authenticate (auth) {
  if (!auth) {
    return null;
  }

  const [type, creds] = auth.split(' ');

  if ('Basic' !== type || !creds) {
    return null;
  }

  const [username, password] = Buffer.from(creds, 'base64').toString().split(':');

  if (!username || !password) {
    return null;
  }

  const user = await r.table('users').get(username);

  if (!user) {
    return null;
  }

  const isPasswordValid = await compare(password, user.password);

  if (!isPasswordValid) {
    return null;
  }

  return user;
}


/**
 * Retrieves a list of users in the server with the provided serverId
 * @param {Number} serverId The user to get the servers of
 * @returns {Array<Object>} A list of users in the server
 */
function getUsersInServer (serverId) {
  return r.table('users').filter(u => u('servers').contains(serverId)).without(['servers', 'password']);
}


/**
 * Checks whether a user is in a server
 * @param {String} userId The user to check the servers of
 * @param {Number} serverId The server to check the user's presence of
 * @returns {Boolean} Whether the user is in the server
 */
function isInServer (userId, serverId) {
  return r.table('users').get(userId)('servers').contains(serverId).default(false);
}


/**
 * Gets a list of servers that the given user is in
 * @param {String} username Username of the user to retrieve the servers of
 * @returns {Array<Object>} A list of servers that the user is in
 */
async function getServersOfUser (username) {
  const user = await r.table('users').get(username);

  if (!user) {
    return []; // This shouldn't happen but you can never be too careful
  }

  const servers = await r.table('servers')
    .getAll(...user.servers)
    .merge(server => ({
      members: r.table('users').filter(u => u('servers').contains(server('id'))).without(['servers', 'password']).coerceTo('array')
    }));

  return servers;
}


/**
 * Updates the online status of the given user
 * @param {String} username Username of the user to update the presence of
 * @param {Boolean} online Whether the user is online or not
 */
function updatePresenceOf (username, online) {
  r.table('users').get(username).update({ online }).run();
}


/**
 * Resets the online status of all members. Useful when the server is shutting down
 */
function resetPresenceStates () {
  return r.table('users').update({ online: false });
}


/**
 * Updates the online status of the given user
 * @param {String} username Username of the user to update the presence of
 * @param {Boolean} online Whether the user is online or not
 */
function getUser (username) {
  return r.table('users').get(username);
}


/**
 * Retrieves a user without private properties
 * @param {String} username The name of the user to retrieve
 * @returns {Object|Null} The user, if they exist
 */
function getMember (username) {
  return r.table('users').get(username).without(['password', 'servers']);
}


/**
 * Removes a member from a server
 * @param {String} username The name of the user to kick from the server
 * @param {Number} serverId The server to remove the member from
 */
function removeMemberFromServer (username, serverId) {
  return r.table('users')
    .get(username)
    .update({
      servers: r.row('servers').difference([serverId])
    });
}


/**
 * Returns the number of servers that the given user owns
 * @param {String} username The username to filter servers against
 * @returns {Number} The amount of servers the user owns
 */
function getOwnedServers (username) {
  return r.table('servers').filter(s => s('owner').eq(username)).count();
}


/**
 * Retrieves a server from the database by its ID
 * @param {Number} serverId The ID of the server to retrieve
 * @returns {Object|Null} The server, if it exists
 */
function getServer (serverId) {
  return r.table('servers')
    .get(serverId)
    .merge(server => ({
      members: r.table('users').filter(u => u('servers').contains(server('id'))).without(['servers', 'password']).coerceTo('array')
    }));
}


/**
 * Deletes a server by its ID
 * @param {Number} serverId The ID of the server to delete
 */
async function deleteServer (serverId) {
  await r.table('servers').get(serverId).delete();
  await r.table('invites').filter(inv => inv('serverId').eq(serverId)).delete();

  await r.table('users')
    .filter(u => u('servers').contains(serverId))
    .update({
      servers: r.row('servers').difference([serverId])
    });
}


/**
 * Checks if the given user is the owner of the given server
 * @param {String} username The name of the user to check
 * @param {Number} serverId The id of the server to check
 * @returns {Boolean} Whether or not the user owns the server
 */
function ownsServer (username, serverId) {
  return r.table('servers').get(serverId)('owner').eq(username).default(false);
}


/**
 * Checks whether the server exists
 * @param {Number} serverId The id of the server to check
 * @returns {Boolean} Whether the server exists or not
 */
function serverExists (serverId) {
  if (!serverId) {
    return false;
  }

  return r.table('servers').filter({ id: serverId }).count().eq(1);
}


/**
 * Generates an invite for the specified server
 * @param {Number} serverId The server ID to associate the invite with
 * @param {String} inviter The user who generated the invite
 * @returns {String} The invite code
 */
async function generateInvite (serverId, inviter) {
  const invite = shortId();

  await r.table('invites').insert({
    id: invite,
    serverId,
    inviter
  });

  return invite;
}


/**
 * Returns an invite object from the provided code
 * @param {String} code The code to lookup
 * @returns {Object|Null} The invite, if it exists
 */
function getInvite (code) {
  return r.table('invites').get(code);
}


function storeMessage (id, author) {
  r.table('messages').insert({ id, author }).run();
}


function retrieveMessage (id) {
  return r.table('messages').get(id);
}


module.exports = {
  addMemberToServer,
  authenticate,
  createUser,
  createServer,
  deleteServer,
  generateInvite,
  getInvite,
  getMember,
  getOwnedServers,
  getUser,
  getUsersInServer,
  getServer,
  getServersOfUser,
  isInServer,
  ownsServer,
  removeMemberFromServer,
  resetPresenceStates,
  retrieveMessage,
  serverExists,
  storeMessage,
  updatePresenceOf,
};
