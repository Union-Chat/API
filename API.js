const config = require('./Configuration.json');
const { randomBytes } = require('crypto');
const { deduplicate, filter, getClientsById, remove } = require('./Utils.js');
const { addMemberToServer, authenticate, createUser, createServer, deleteServer, generateInvite, getMember, getInvite,
  getOwnedServers, getServer, isInServer, ownsServer, removeMemberFromServer, serverExists, storeMessage } = require('./DatabaseHandler.js');
const { dispatchMessage, dispatchMember, dispatchMemberLeave, dispatchServerJoin, dispatchServerLeave } = require('./Dispatcher.js');
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

  if (!username || 0 === username.trim().length) {
    return res.status(400).json({ 'error': 'Username cannot be empty.' });
  }

  if (username.trim().length > config.rules.usernameCharacterLimit) {
    return res.status(400).json({ 'error': `Username cannot exceed ${config.rules.usernameCharacterLimit} characters.` });
  }

  if (!password || 5 > password.length) {
    return res.status(400).json({ 'error': 'Password cannot be empty and must be 5 characters long or more.' });
  }

  const created = await createUser(username.trim(), password);

  if (created) {
    return res.status(200).send('Account created! You may now login.'); // todo: json
  } else {
    return res.status(200).send('Unable to create account (it may already exist!)'); // also json here
  }
});

api.post('/server', authorize, async (req, res) => {  // this feels so inconsistent lul
  const { name, iconUrl } = req.body;

  if (!name || 0 === name.trim().length) {
    return res.status(400).json({ 'error': 'Server name cannot be empty.' });
  }

  if (await getOwnedServers(req.user.id) >= config.rules.maxServersPerUser) {
    return res.status(400).json({ 'error': `You cannot create more than ${config.rules.maxServersPerUser} servers` });
  }

  const server = await createServer(name, iconUrl, req.user.id);

  res.status(200).send();

  const clients = getClientsById(global.server.clients, req.user.id);

  if (0 < clients.length) {
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

  if (0 < clients.length) {
    clients.forEach(ws => remove(ws.user.servers, serverId));
    dispatchServerLeave(clients, serverId);
  }
});


api.post('/server/:serverId/invite', validateServer, authorize, async (req, res) => {
  const { serverId } = req;

  if (!await ownsServer(req.user.id, serverId)) {
    return res.status(403).json({ 'error': 'Only the server owner can generate invites.' });
  }

  const inviteCode = await generateInvite(serverId, req.user.id);

  res.status(200).send({ code: inviteCode });
});


api.post('/server/:serverId/messages', validateServer, authorize, async (req, res) => {
  const { serverId } = req;
  const { content } = req.body;

  if (!req.user.servers.includes(serverId)) {
    return res.status(400).json({ 'error': 'You cannot send messages to this server' });
  }

  if (!content || 0 === content.trim().length) {
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


api.post('/invites/:inviteId', authorize, async (req, res) => {
  const invite = await getInvite(req.params.inviteId);

  if (!invite) {
    return res.status(404).json({ 'error': 'Unknown invite' });
  }

  if (!await serverExists(invite.serverId)) {
    return res.status(404).json({ 'error': 'Unknown server; invite expired' });
  }

  const { serverId } = invite;

  if (await isInServer(req.user.id, serverId)) {
    return res.status(200).send();
  }

  await addMemberToServer(req.user.id, serverId);

  const clients = await getClientsById(global.server.clients, req.user.id);
  const server = await getServer(serverId);

  if (0 < clients.length) {
    clients.forEach(ws => ws.user.servers = deduplicate(ws.user.servers, serverId));
    dispatchServerJoin(clients, server);
  }

  const members = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId) && ws.user.id !== req.user.id);
  const member  = await getMember(req.user.id);

  if (0 < members.length) {
    dispatchMember(members, serverId, member);
  }

  res.status(200).send();
});


api.delete('/self/server/:serverId', validateServer, authorize, async (req, res) => {
  const { serverId } = req;

  if (!await isInServer(req.user.id, serverId)) {
    return res.status(400).json({ 'error': 'You are not in that server' });
  }

  await removeMemberFromServer(req.user.id, serverId);

  const self = await getClientsById(global.server.clients, req.user.id);
  const members = filter(global.server.clients, ws => ws.isAuthenticated && ws.user.servers.includes(serverId));

  if (0 < members.length) {
    dispatchMemberLeave(members, req.user.id, serverId);
  }

  if (0 < self.length) {
    self.forEach(ws => remove(ws.user.servers, serverId));
  }

  res.status(200).send();
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
