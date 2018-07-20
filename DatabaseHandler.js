const { hash, compare } = require('bcrypt');
const r = require('rethinkdbdash')({
  db: 'union'
});


/**
 * Creates a user object with the provided username and password, and stores it in the DB
 * @param {String} username The username of the account to create
 * @param {String} password The password of the account to create
 * @returns {Boolean} Whether the account was created or not
 */
async function createUser (username, password) {
  const account = await r.table('users').get(username);

  if (account !== null) {
    return false;
  } else {
    await r.table('users').insert({
      id: username,
      password: await hash(password, 10),
      createdAt: Date.now(),
      servers: await getServers(), // Throw them in every server because why not
      online: false
    });

    return true;
  }
}


/**
 * Creates a server with the provided name and iconUrl
 * @param {String} name The name of the server
 * @param {String} iconUrl A URL leading to an image to be used as the server's icon
 * @returns {Object} The created server
 */
async function createServer (name, iconUrl, owner) {
  const largestId = await r.table('servers').max('id');
  const id = largestId + 1;

  const server = {
    name,
    iconUrl,
    owner,
    id
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

  if (type !== 'Basic' || !creds) {
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
  return r.table('users').filter(u => u('servers').contains(server('id'))).without(['servers', 'password']);
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
  return r.table('users').get(username).without('password').without('servers');
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
 * Retrieves the IDs of all servers in the database
 * @returns {Array<Number>} The server IDs
 */
async function getServers () {
  const servers = await r.table('servers');
  return servers.map(s => s.id);
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
 * @returns {String[]} The users to dispatch serverLeave to
 */
async function deleteServer (serverId) {
  await r.table('servers').get(serverId).delete();

  const inServer = await r.table('users').filter(u => u('servers').contains(serverId));

  await r.table('users')
    .filter(u => u('servers').contains(serverId))
    .update({
      servers: r.row('servers').difference([serverId])
    });

  return inServer.map(u => u.id);
}


/**
 * Checks if the given user is the owner of the given server
 * @param {String} username The name of the user to check
 * @param {Number} serverId The id of the server to check
 * @returns {Boolean} Whether or not the user owns the server
 */
async function ownsServer (username, serverId) {
  const server = await r.table('servers').get(serverId);
  return server && server.owner === username;
}

function storeMessage (id, author) {
  r.table('messages').insert({ id, author }).run();
}


function retrieveMessage (id) {
  return r.table('messages').get(id);
}

// TODO: When a server is created and deleted, the changes aren't reflected in the client websocket until it logs back in.


module.exports = {
  authenticate,
  createUser,
  createServer,
  deleteServer,
  getMember,
  getOwnedServers,
  getUser,
  getUsersInServer,
  getServersOfUser,
  ownsServer,
  retrieveMessage,
  storeMessage,
  updatePresenceOf,
};
