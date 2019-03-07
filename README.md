# Union
A light chat service

## Installation

 - `git clone https://github.com/Union-Chat/Union-Server` - Download Union-Server
 - `yarn` or `npm i` Installs dependencies
 - `yarn run getui` or `npm run getui` - Downloads and builds `union-react`
 - Create a config.json with your custom settings (See `config.example.json`)
 - `yarn run start` or `npm run start` - Start the app!
 
During the 1st startup you'll be prompted to set credentials for the root user. This user will always have #0001 as
discriminator and will have administrator permissions on the Union instance. Don't loose credentials you'll set there!

## Updating

 - Stop Union
 - `git pull` - Download the latest Union-Server
 - `yarn` or `npm i` Installs/updates dependencies
 - `yarn run getui` or `npm run getui` - Updates the UI
 - Check if there is no new fields/moved fields in config.json
 - `yarn run start` or `npm run start` - Start the app

*Note*: You can just run `yarn run getui` if you just want to update union-react. No restart should be required.
