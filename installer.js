const { execSync } = require('child_process')
const { migrator, drain } = require('./migrations/_migrator')

console.log('Union installer v1.0.0')
console.log('Migrating database...')
migrator().then(() => {
  console.log('Downloading web interface...')
  execSync('rm -rf union-react', { stdio: [null, null, null] })
  execSync('git clone https://github.com/Union-Chat/union-react', { stdio: [null, null, null] })

  console.log('Building web interface...')
  execSync('cd union-react && yarn && yarn run prod && cd ..', { stdio: [null, null, null] })

  console.log('Cleaning up...')
  execSync('rm -rf dist', { stdio: [null, null, null] })
  execSync('mv union-react/index.html index.html', { stdio: [null, null, null] })
  execSync('mv union-react/dist dist', { stdio: [null, null, null] })
  execSync('rm -rf union-react', { stdio: [null, null, null] })

  console.log('Success! Union is ready to work. Just do `yarn run start`')
  drain()
})
