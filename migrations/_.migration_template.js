// - A migration should NEVER be updated. If you want to update something, create a new migration
// - ALL data must be kept safe during a migration. It can be updated, but no data should be deleted, expect if it's
// no longer required by the application

// Your migration have to export an async function that accepts the connection in its params
module.exports = async (r, dbName) => {
  r.db(dbName).tableCreate('test');
  // ...
};
