# Union
A light chat service

## Installation

 - `git clone https://github.com/Union-Chat/Union-Server` - Download Union-Server
 - `yarn run setup` - Build the server & the UI, setup the database<br>
During this step, the installer will ask you the credentials for administrator
account. By default, it'll be `root` and `root` but you can change is as you
want. Discriminator will always be `0001` 
 - Create a Configuration.json with your custom settings
 - `yarn run start` - Start the app!

## Updating

 - `git pull` - Download the latest Union-Server
 - `yarn run setup` - Re-build everything (**Will keep your database safe** and update it)
 - Check if there is no new fields in Configuration.json
 - `yarn run start` - Start the app!
