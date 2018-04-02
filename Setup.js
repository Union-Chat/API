const r = require('rethinkdbdash')({
    db: 'union'
});

//
//  UPDATES ALL SERVERS TO INCLUDE 'MEMBERS' PROPERTY
//


const servers = r.table('servers').run();
const users = r.table('users').without(['password', 'servers']).run();

Promise.all([servers, users]).then(async (results) => {
    const [s, u] = results;

    s.forEach(async (server) => {
        await r.table('servers').get(server.id).update({ members: u }).run();
    });

    await r.getPoolMaster().drain();
    console.log('servers updated');
});
