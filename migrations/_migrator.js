const dbName = 'union' + (process.env.NODE_ENV !== 'production' ? '_' + process.env.NODE_ENV : '')

const r = require('rethinkdbdash')({ silent: true, db: dbName })
const path = require('path')
const fs = require('fs')

const migrator = async function () {
  // Get some env info
  let lastMigration = 0
  if (fs.existsSync(path.resolve(__dirname, '_migration'))) lastMigration = parseInt(fs.readFileSync(path.resolve(__dirname, '_migration')))

  // List available migrations & filter already executed ones
  const files = fs.readdirSync(__dirname).filter(file => {
    if (file.startsWith('_')) return false
    return parseInt(file.split('.')[0]) > lastMigration
  })

  // Create database if not exists
  let databases = await r.dbList().run()
  if (databases.indexOf(dbName) === -1) await r.dbCreate(dbName).run()

  // Run migrations!
  const promises = []
  files.forEach(file => {
    promises.push(new Promise(async resolve => {
      const meta = file.split('.')
      lastMigration = parseInt(meta[0])
      await require('./' + file)(r, dbName)
      resolve()
    }))
  })
  await Promise.all(promises)
  fs.writeFileSync(path.resolve(__dirname, '_migration'), lastMigration)
}

module.exports = {
  migrator,
  drop: async function () {
    await r.dbDrop(dbName).run()
    fs.unlinkSync(path.resolve(__dirname, '_migration'))
  },
  drain: () => r.getPoolMaster().drain()
}
