# Union
A light chat service

## Installation

 - `git clone https://github.com/Union-Chat/Union-Server` - Download Union-Server
 - `yarn run setup` - Build the server & the UI, setup the database
 - Create a Configuration.json with your custom settings
 - `yarn run start` - Start the app!

By default a root user with admin perms will be created
<br/>Username: `root#0001`
<br/>Password: `root` (you should change it as soon as possible)

## Updating

 - `git pull` - Download the latest Union-Server
 - `yarn run setup` - Re-build everything (**Will keep your database safe** and update it)
 - Check if there is no new fields in Configuration.json
 - `yarn run start` - Start the app!
