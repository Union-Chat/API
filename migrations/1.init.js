module.exports = async (r, dbName) => {
  await r.db(dbName).tableCreate('users').run()
  await r.db(dbName).tableCreate('servers').run()
  await r.db(dbName).tableCreate('invites').run()
  await r.db(dbName).tableCreate('messages').run()
}
