const { execSync } = require('child_process')
const { migrator } = require('./migrations/_migrator')

console.log('Union installer v1.0.0')

console.log('Migrating database...')
migrator().then(() => {
  console.log('Downloading web interface...')
  execSync('rm -rf union-react')
  execSync('git clone https://github.com/Union-Chat/union-react')

  console.log('Building web interface...')
  execSync('cd union-react && yarn && yarn run prod && cd ..')

  console.log('Cleaning up...')
  execSync('rm -rf dist')
  execSync('mv union-react/index.html index.html')
  execSync('mv union-react/dist dist')
  execSync('rm -rf union-react')

  console.log('Success! Union is ready to work. Just do `yarn run start`')
  // Manually exit because rethink is annoying
  process.exit(0)
})
