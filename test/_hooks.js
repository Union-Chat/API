/* eslint-env node, mocha */
import { drain as migratorDrain } from '../migrations/_migrator';
import { drain } from '../src/database';

after(() => {
  migratorDrain();
  drain();
});
