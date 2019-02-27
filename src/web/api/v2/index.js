const express = require('express');
const bodyParser = require('body-parser');

const Middlewares = require('../../middlewares');
const Core = require('./core');
const Users = require('./users');
const Servers = require('./servers');
const Messages = require('./messages');
const Invites = require('./invites');

const api = express.Router();
const notImplemented = (req, res) => res.status(501).json({ error: 'This feature is not implemented yet. Contribute to help us bring this feature faster! https://github.com/Union-Chat/Union-Server' });

// Middlewares
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: true }));
api.use(Middlewares.cors);

// Core
api.get('/', Middlewares.rateLimit(), Core.home);
api.get('/info', Middlewares.rateLimit(), Core.info);

// User
api.post('/users', Middlewares.rateLimit(), Users.create);
api.get('/users/self', Middlewares.rateLimit(), Middlewares.authenticate, Users.getSelf);
api.put('/users/self', Middlewares.rateLimit(), Middlewares.authenticate, Users.patch);
api.patch('/users/self', Middlewares.rateLimit(), Middlewares.authenticate, Users.patch);
api.delete('/users/self', Middlewares.rateLimit(), Middlewares.authenticate, Users.delete);
// @todo: Auth flow with 2FA
// @todo: Account linking (Discord, GitHub, Spotify, ...)
// @todo: Friends and blocks https://open.spotify.com/track/08bNPGLD8AhKpnnERrAc6G

// Server
api.post('/servers', Middlewares.rateLimit(), Middlewares.authenticate, Servers.create);
api.put('/servers/:serverId([0-9]+)', Middlewares.rateLimit(), Middlewares.authenticate, Middlewares.serverExists, Servers.patch);
api.patch('/servers/:serverId([0-9]+)', Middlewares.rateLimit(), Middlewares.authenticate, Middlewares.serverExists, Servers.patch);
api.delete('/servers/:serverId([0-9]+)', Middlewares.rateLimit(), Middlewares.authenticate, Middlewares.serverExists, Servers.delete);
api.delete('/servers/:serverId([0-9]+)/leave', Middlewares.rateLimit(), Middlewares.authenticate, Middlewares.serverExists, Servers.leave);

api.post('/servers/:serverId/messages', Middlewares.rateLimit(), Middlewares.authenticate, Middlewares.serverExists, Messages.create);
api.put('/servers/:serverId/messages/:messageId', Middlewares.rateLimit(), Middlewares.authenticate, Middlewares.serverExists, Messages.patch);
api.patch('/servers/:serverId/messages/:messageId', Middlewares.rateLimit(), Middlewares.authenticate, Middlewares.serverExists, Messages.patch);
api.delete('/servers/:serverId/messages/:messageId', Middlewares.rateLimit(), Middlewares.authenticate, Middlewares.serverExists, Messages.delete);
// @todo: Channels
// @todo: Roles and permissions

// Invites
api.post('/servers/:serverId([0-9]+)/invites', Middlewares.rateLimit(), Middlewares.authenticate, Middlewares.serverExists, Invites.create);
api.post('/invites/:inviteId([a-zA-Z0-9-_]+)', Middlewares.rateLimit(), Middlewares.authenticate, Invites.accepts);
// @todo: Invite management (List, update, delete)

// Themes @todo
api.get('/themes/all', Middlewares.rateLimit(), notImplemented);
api.get('/themes/search', Middlewares.rateLimit(), notImplemented);
api.post('/themes/:themeId/vote', Middlewares.rateLimit(), notImplemented);
api.delete('/themes/:themeId/vote', Middlewares.rateLimit(), notImplemented);

api.post('/themes', Middlewares.rateLimit(), notImplemented);
api.put('/themes/:themeId', Middlewares.rateLimit(), notImplemented);
api.patch('/themes/:themeId', Middlewares.rateLimit(), notImplemented);
api.delete('/themes/:themeId', Middlewares.rateLimit(), notImplemented);

// Botlist @todo

// Developers @todo
api.get('/developers/applications', Middlewares.rateLimit(), notImplemented);
api.post('/developers/applications', Middlewares.rateLimit(), notImplemented);

api.get('/developers/applications/:applicationId', Middlewares.rateLimit(), notImplemented);
api.put('/developers/applications/:applicationId', Middlewares.rateLimit(), notImplemented);
api.patch('/developers/applications/:applicationId', Middlewares.rateLimit(), notImplemented);
api.delete('/developers/applications/:applicationId', Middlewares.rateLimit(), notImplemented);

api.get('/oauth2/authorize', Middlewares.rateLimit(), notImplemented);
api.post('/oauth2/token', Middlewares.rateLimit(), notImplemented);
api.post('/oauth2/revoke', Middlewares.rateLimit(), notImplemented);

// Admin zone @todo

module.exports = api;
