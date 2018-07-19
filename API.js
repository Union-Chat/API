const config = require('./Configuration.json');
const { randomBytes } = require('crypto');
const { filter, findFirst } = require('./Utils.js');
const { authenticate, createUser, createServer, storeMessage } = require('./DatabaseHandler.js');
const { dispatchMessage, dispatchServerCreate } = require('./Dispatcher.js');
const express = require('express');
const bodyParser = require('body-parser');
const api = express.Router();

api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: true }));
api.use(allowCORS);
//api.use(notFound);

api.get('/', (req, res) => {
  res.send('Welcome to the Union API!');
  // TODO: Serve docs or something
});

api.patch('/self', (req, res) => {
  res.send('Not done.');
  // TODO
});

api.post('/message', async (req, res) => {
  const user = await authenticate(req.headers.authorization);

  if (!user) {
    return res.status(401).json({ 'error': 'Unauthorized: You must be logged in to send messages.' });
  }

  if (!req.body.server || !Number(req.body.server)) {
    return res.status(400).json({ 'error': 'Server must be a number' });
  }

  if (!user.servers.includes(Number(req.body.server))) {
    return res.status(400).json({ 'error': 'You cannot send messages to this server' });
  }

  if (!req.body.content || req.body.content.trim().length === 0) {
    return res.status(400).json({ 'error': 'Content must be a string and not empty' });
  }

  if (req.body.content.length > config.rules.messageCharacterLimit) {
    return res.status(400).json({ 'error': `Content cannot exceed ${config.rules.messageCharacterLimit} characters` });
  }

  const { server, content } = req.body;

  const id = randomBytes(15).toString('hex');
  storeMessage(id, user.id);

  const message = {
    id,
    server,
    content: content.trim(),
    author: user.id,
    createdAt: Date.now()
  };

  const recipients = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(server));
  dispatchMessage(recipients, message);
  res.status(200).send();
});

api.post('/create', async (req, res) => {
  const { username, password } = req.body;

  if (!username || username.trim().length === 0) {
    return res.send('Username cannot be empty.');
  }

  if (username.trim().length > config.rules.usernameCharacterLimit) {
    return res.send(`Username cannot exceed ${config.rules.usernameCharacterLimit} characters.`);
  }

  if (!password || password.length < 5) {
    return res.send('Password cannot be empty and must be 5 characters long or more.');
  }

  const created = await createUser(username.trim(), password);

  if (created) {
    return res.send('Account created! You may now login.');
  } else {
    return res.send('Unable to create account (it may already exist!)');
  }
});

api.post('/serverCreate', async (req, res) => {  // this feels so inconsistent lul
  const user = await authenticate(req.headers.authorization);

  if (!user) {
    return res.status(401).json({ 'error': 'Unauthorized: You must be logged in to create servers.' });
  }

  const { name, iconUrl } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ 'error': 'Server name cannot be empty.' });
  }

  const server = await createServer(name, iconUrl, user.id);

  res.status(200).send();

  const client = findFirst(global.server.clients, ws => ws.isAuthenticated && ws.user.id === user.id);

  if (client) {
    dispatchServerCreate(client, server);
  }
});


//function notFound(req, res, next) {
//    res.status(404).send('The requested URL wasn\'t found!');
//}

function allowCORS (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}

module.exports = api;
