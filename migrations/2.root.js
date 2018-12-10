const FlakeId = require('flakeid');
const { hash } = require('bcrypt');
const prompt = require('prompt');

const idGenerator = new FlakeId({
  timeOffset: (2018 - 1970) * 31536000 * 1000
});

module.exports = (r, dbName) => {
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
      await r.db(dbName).table('users').insert({
        id: idGenerator.gen(),
        username: results.username,
        discriminator: '0001',
        password: await hash(results.password, 10),
        servers: [],
        online: false,
        admin: true
      });
      prompt.stop();
      res();
    });
  });
};
