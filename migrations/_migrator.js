const dbName = 'union' + (process.env.NODE_ENV !== 'production' ? '_' + process.env.NODE_ENV : '')

const r = require('rethinkdbdash')({ db: dbName })
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
  files.forEach(async file => {
    const meta = file.split('.')
    lastMigration = parseInt(meta[0])
    console.log('Running migration ' + meta[1])
    await require('./' + file)(r, dbName)
  })

  fs.writeFileSync(path.resolve(__dirname, '_migration'), lastMigration)
}

module.exports = {
  migrator,
  drop: async function () {
    await r.dbDrop(dbName).run()
    fs.unlinkSync(path.resolve(__dirname, path.resolve(__dirname, '_migration')))
  }
}
