/* eslint-env node, mocha */
import { drain as migratorDrain } from '../migrations/_migrator'
import { drain } from '../src/DatabaseHandler'

after(() => {
  migratorDrain()
  drain()
})
