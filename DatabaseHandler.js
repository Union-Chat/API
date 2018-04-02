const { hash, compare } = require('bcrypt');
const r = require('rethinkdbdash')({
    db: 'union'
});


/**
 * TODO: Description
 * @param {String} username The username of the account to create
 * @param {String} password The password of the account to create
 * @returns {Boolean} Whether the account was created or not
 */
async function create(username, password) {
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
 * TODO: Description
 * @param {String} username The username of the account to check
 * @param {String} password The password of the account to check
 * @returns {(Null|Object)} The user object if authentication was successful, otherwise null
 */
async function authenticate(username, password) {
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
 * TODO: Description
 * @param {Number} serverId The user to get the servers of
 */
async function getUsersInServer(serverId) {
    const users = await r.table('users').without('password');
    return users.filter(user => user.servers.includes(serverId));
}

/**
 * TODO: Description
 * @param {String} username Username of the user to retrieve the servers of
 */
async function getServersOfUser(username) {
    const user = await r.table('users').get(username);

    if (!user) {
        return []; // This shouldn't happen but you can never be too careful
    }

    const servers = await r.table('servers')
        .getAll(...user.servers)
        .merge(server => ({
            members: r.table('users').without('password').filter(u => u('servers').nth(0).eq(server('id'))).coerceTo('array')
        }))
        .coerceTo('array');

    servers.forEach(serv => {
        serv.members.forEach(m => delete m.servers);
    });

    return servers;
}


/**
 * Updates the online status of the given user
 * @param {String} username Username of the user to update the presence of
 * @param {Boolean} online Whether the user is online or not
 */
function updatePresenceOf(username, online) {
    r.table('users').get(username).update({ online }).run();
}

async function getUser(username) {
    const user = await r.table('users').get(username);
    return user;
}


async function getServers() {
    const servers = await r.table('servers');
    return servers.map(s => s.id);
}

function storeMessage(id, author) {
    r.table('messages').insert({ id, author }).run();
}

async function retrieveMessage(id) {
    const msg = await r.table('messages').get(id);
    return msg;
}


module.exports = {
    create,
    authenticate,
    getUsersInServer,
    getServersOfUser,
    updatePresenceOf,
    getUser,
    storeMessage,
    retrieveMessage
};
