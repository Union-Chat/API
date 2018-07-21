const config = require('./Configuration.json');
const { randomBytes } = require('crypto');
const { deduplicate, filter, getClientsById, remove } = require('./Utils.js');
const { authenticate, createUser, createServer, generateInvite, getOwnedServers, ownsServer, deleteServer, serverExists, storeMessage } = require('./DatabaseHandler.js');
const { dispatchMessage, dispatchServerJoin, dispatchServerLeave } = require('./Dispatcher.js');
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

api.post('/create', async (req, res) => {
  const { username, password } = req.body;

  if (!username || username.trim().length === 0) {
    return res.status(400).json({ 'error': 'Username cannot be empty.' });
  }

  if (username.trim().length > config.rules.usernameCharacterLimit) {
    return res.status(400).json({ 'error': `Username cannot exceed ${config.rules.usernameCharacterLimit} characters.` });
  }

  if (!password || password.length < 5) {
    return res.status(400).json({ 'error': 'Password cannot be empty and must be 5 characters long or more.' });
  }

  const created = await createUser(username.trim(), password);

  if (created) {
    return res.status(200).send('Account created! You may now login.'); // todo: json
  } else {
    return res.status(200).send('Unable to create account (it may already exist!)'); // also json here
  }
});

api.post('/server/:serverId/messages', validateServer, authorize, async (req, res) => {
  const { serverId } = req;
  const { content } = req.body;

  if (!req.user.servers.includes(serverId)) {
    return res.status(400).json({ 'error': 'You cannot send messages to this server' });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ 'error': 'Content must be a string and not empty' });
  }

  if (content.length > config.rules.messageCharacterLimit) {
    return res.status(400).json({ 'error': `Content cannot exceed ${config.rules.messageCharacterLimit} characters` });
  }

  const id = randomBytes(15).toString('hex');
  storeMessage(id, req.user.id);

  const message = {
    id,
    server: serverId,
    content: content.trim(),
    author: req.user.id,
    createdAt: Date.now()
  };

  const recipients = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId));
  dispatchMessage(recipients, message);
  res.status(200).send();
});

api.post('/server', authorize, async (req, res) => {  // this feels so inconsistent lul
  const { name, iconUrl } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ 'error': 'Server name cannot be empty.' });
  }

  if (await getOwnedServers(req.user.id) >= config.rules.maxServersPerUser) {
    return res.status(400).json({ 'error': `You cannot create more than ${config.rules.maxServersPerUser} servers` });
  }

  const server = await createServer(name, iconUrl, req.user.id);

  res.status(200).send();

  const clients = getClientsById(global.server.clients, req.user.id);

  if (clients.length > 0) {
    clients.forEach(ws => ws.user.servers = deduplicate(ws.user.servers, server.id));
    dispatchServerJoin(clients, server);
  }
});


api.delete('/server/:serverId', validateServer, authorize, async (req, res) => {
  const { serverId } = req;

  if (!await ownsServer(req.user.id, serverId)) {
    return res.status(403).json({ 'error': 'You can only delete servers that you own.' });
  }

  await deleteServer(serverId);

  res.status(200).send();

  const clients = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId));

  if (clients.length > 0) {
    clients.forEach(ws => remove(ws.user.servers, serverId));
    dispatchServerLeave(clients, serverId);
  }
});


api.post('/server/:serverId/invites', validateServer, authorize, async (req, res) => {
  const { serverId } = req;

  if (!await ownsServer(req.user.id, serverId)) {
    return res.status(403).json({ 'error': 'Only the server owner can generate invites.' });
  }

  const inviteCode = await generateInvite(serverId, req.user.id);

  res.status(200).send({ code: inviteCode });

  // TODO:
  // Method to join servers with invite codes
  // Dispatch memberJoin to users in the server associated with the invite ID
  // Dispatch serverJoin to the user who accepted the invite
});


/**
 * Validates the 'authorization' header and populates req.user
 */
async function authorize (req, res, next) {
  const user = await authenticate(req.headers.authorization);

  if (!user) {
    return res.status(401).json({ 'error': 'Unauthorized: You must be logged in to access this route.' });
  }

  req.user = user;
  next();
}


/**
 * Ensures a server matching 'serverId' exists
 */
async function validateServer (req, res, next) {
  const { serverId } = req.params;
  const sid = Number(serverId);

  if (!await serverExists(sid)) {
    return res.status(400).json({ 'error': 'Unknown server' });
  }

  req.serverId = sid;
  next();
}


/**
 * Middleware to allow CORS
 */
function allowCORS (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}


module.exports = api;
