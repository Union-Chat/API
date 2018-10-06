const { execSync } = require('child_process')

console.log('Union installer v1.0.0')

console.log('Migrating database...')
// @todo

console.log('Downloading web interface...')
execSync('git clone https://github.com/Union-Chat/union-react')

console.log('Building web interface...')
execSync('cd union-react && yarn && yarn run prod && cd ..')

console.log('Cleaning up...')
execSync('mv union-react/index.html index.html')
execSync('mv union-react/dist dist')
execSync('rm -rf union-react')

console.log('Success! Union is ready to work. Just do `yarn run start`')
