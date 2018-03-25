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
            servers: []
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
    const account = await r.table('users').get(username);

    if (account === null) {
        return false;
    } else {
        const isPasswordValid = await compare(password, account.password);
        if (isPasswordValid) {
            return account;
        } else {
            return null;
        }
    }
}


/**
 * TODO: Description
 * @param {Number} serverId The user to get the servers of
 */
async function getUsersInServer(serverId) {
    const users = await r.table('users');
    const inServer = users.filter(user => user.servers.includes(serverId));
    return inServer;
}

module.exports = {
    create,
    authenticate,
    getUsersInServer
};
