const FlakeId = require('flakeid');
const { hash } = require('bcrypt');
const idGenerator = new FlakeId({
  timeOffset: (2018 - 1970) * 31536000 * 1000
});

module.exports = async (r, dbName) => {
  await r.db(dbName).table('users').insert({
    id: idGenerator.gen(),
    username: 'root',
    discriminator: '0001',
    password: await hash('root', 10),
    servers: [],
    online: false,
    admin: true
  });
};
