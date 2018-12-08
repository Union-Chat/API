import crypto from 'crypto';
import express from 'express';
import bodyParser from 'body-parser';

import allowCORS from '../middlewares/cors';
import authorize from '../middlewares/authorize';
import serverExists from '../middlewares/serverExists';

import { home, info } from './core';
import { create as userCreate, getSelf as userGetSelf, patch as userPatch, remove as userDelete } from './users';
import { post as messagePost, patch as messagePatch, remove as messageRemove } from './messages';
import { create as serverCreate, leave as serverLeave, remove as serverDelete, patch as serverPatch } from './servers';
import { create as inviteCreate, accept as inviteAccept } from './invites';
import RateLimit from 'express-rate-limit';

const api = express.Router();
const notImplemented = (req, res) => res.status(501).json({ error: 'This feature is not implemented yet. Contribute to help us bring this feature faster! https://github.com/Union-Chat/Union-Server' });
const getB1nzy = () => new RateLimit({
  keyGenerator: req => {
    const shasum = crypto.createHash('sha1');
    shasum.update(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    return `${req.originalUrl}:${shasum.digest('hex')}`;
  },
  windowMs: 1000,
  max: 5
});

// Middlewares
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: true }));
api.use(allowCORS);

// Core
api.get('/', getB1nzy(), home);
api.get('/info', getB1nzy(), info);

// User
api.post('/users', getB1nzy(), userCreate);
api.get('/users/self', getB1nzy(), authorize, userGetSelf);
api.put('/users/self', getB1nzy(), authorize, userPatch);
api.patch('/users/self', getB1nzy(), authorize, userPatch);
api.delete('/users/self', getB1nzy(), authorize, userDelete);
// @todo: Auth flow with 2FA
// @todo: Account linking (Discord, GitHub, Spotify, ...)
// @todo: Friends and blocks https://open.spotify.com/track/08bNPGLD8AhKpnnERrAc6G

// DMs @todo

// Server
api.post('/servers', getB1nzy(), authorize, serverCreate);
api.put('/servers/:serverId([0-9]+)', getB1nzy(), authorize, serverExists, serverPatch);
api.patch('/servers/:serverId([0-9]+)', getB1nzy(), authorize, serverExists, serverPatch);
api.delete('/servers/:serverId([0-9]+)/leave', getB1nzy(), authorize, serverExists, serverLeave);
api.delete('/servers/:serverId([0-9]+)', getB1nzy(), authorize, serverExists, serverDelete);

api.post('/servers/:serverId/messages', getB1nzy(), authorize, serverExists, messagePost);
api.put('/servers/:serverId/messages/:messageId', getB1nzy(), authorize, serverExists, messagePatch);
api.patch('/servers/:serverId/messages/:messageId', getB1nzy(), authorize, serverExists, messagePatch);
api.delete('/servers/:serverId/messages/:messageId', getB1nzy(), authorize, serverExists, messageRemove);
// @todo: Channels
// @todo: Roles and permissions

// Invites
api.post('/servers/:serverId([0-9]+)/invites', getB1nzy(), authorize, serverExists, inviteCreate);
api.post('/invites/:inviteId([a-zA-Z0-9-_]+)', getB1nzy(), authorize, inviteAccept);
// @todo: Invite management (List, update, delete)

// Themes @todo
api.get('/themes/all', getB1nzy(), notImplemented);
api.get('/themes/search', getB1nzy(), notImplemented);
api.post('/themes/:themeId/vote', getB1nzy(), notImplemented);
api.delete('/themes/:themeId/vote', getB1nzy(), notImplemented);

api.post('/themes', getB1nzy(), notImplemented);
api.put('/themes/:themeId', getB1nzy(), notImplemented);
api.patch('/themes/:themeId', getB1nzy(), notImplemented);
api.delete('/themes/:themeId', getB1nzy(), notImplemented);

// Developers @todo
api.get('/developers/applications', getB1nzy(), notImplemented);
api.post('/developers/applications', getB1nzy(), notImplemented);

api.get('/developers/applications/:applicationId', getB1nzy(), notImplemented);
api.put('/developers/applications/:applicationId', getB1nzy(), notImplemented);
api.patch('/developers/applications/:applicationId', getB1nzy(), notImplemented);
api.delete('/developers/applications/:applicationId', getB1nzy(), notImplemented);

api.get('/oauth2/authorize', getB1nzy(), notImplemented);
api.post('/oauth2/token', getB1nzy(), notImplemented);
api.post('/oauth2/revoke', getB1nzy(), notImplemented);

// Admin zone @todo

export default api;
