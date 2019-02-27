const { execSync } = require('child_process');

console.log('Downloading web interface...');
execSync('rm -rf union-react', { stdio: [null, null, null] });
execSync('git clone https://github.com/Union-Chat/union-react', { stdio: [null, null, null] });

console.log('Building web interface...');
execSync('cd union-react && npm i --prod false && npm run prod && cd ..', { stdio: [null, null, null] });

console.log('Cleaning up...');
execSync('rm -rf dist', { stdio: [null, null, null] });
execSync('mv union-react/index.html index.html', { stdio: [null, null, null] });
execSync('mv union-react/dist dist', { stdio: [null, null, null] });
execSync('rm -rf union-react', { stdio: [null, null, null] });

console.log('Success! Union is ready to go. Just do `npm run start`');
