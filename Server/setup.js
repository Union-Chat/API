const r = require('rethinkdbdash')({
    db: 'union'
});

const { hash } = require('bcrypt');

/*
(async function() {
    await r.table('users').insert({
        id: 'Testing',
        password: await hash('test', 10),
        createdAt: Date.now(),
        servers: [1]
    });

    await r.table('servers').insert({
        id: 1,
        name: 'Test Server'
    });
})();
*/

/*
(async function() {
    console.log(await r.table('users'));
    console.log(await r.table('servers'));
})();
*/
