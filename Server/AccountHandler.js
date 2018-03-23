const { hash, compare } = require('bcrypt');
const r = require('rethinkdbdash')({
    db: 'union'
});


/**
 *
 * @param {string} username The username of the account to create
 * @param {string} password The password of the account to create
 * @returns {boolean} Whether the account was created or not
 */
async function create(username, password) { // eslint-disable-line
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
 *
 * @param {string} username The username of the account to check
 * @param {string} password The password of the account to check
 * @returns {(null|object)} The user object if authentication was successful, otherwise null
 */
async function authenticate(username, password) { // eslint-disable-line
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

module.exports = {
    create,
    authenticate
};
