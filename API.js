const config = require('./Configuration.json');
const { randomBytes } = require('crypto');
const { filter } = require('./Utils.js');
const { authenticate, create, storeMessage } = require('./DatabaseHandler.js');
const { dispatchMessage } = require('./Dispatcher.js');
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
    const user = await authorize(req.headers.authorization);

    if (!user) {
        return res.status(401).json({ 'error': 'You are not permitted to use this endpoint' });
    }

    if (!req.body.server || !Number(req.body.server)) {
        return res.status(400).json({ 'error': 'server must be a number' });
    }

    if (!user.servers.includes(Number(req.body.server))) {
        return res.status(400).json({ 'error': 'You cannot send messages to this server' });
    }

    if (!req.body.content || req.body.content.trim().length === 0) {
        return res.status(400).json({ 'error': 'content must be a string and not empty' });
    }

    if (req.body.content.length > config.rules.messageCharacterLimit) {
        return res.status(400).json({ 'error': `content cannot exceed ${config.rules.messageCharacterLimit} characters` });
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

    if (!password || password.length === 0) {
        return res.send('Password cannot be empty.');
    }

    const created = await create(username.trim(), password);

    if (created) {
        return res.send('Account created! You may now login.');
    } else {
        return res.send('Unable to create account (it may already exist!)');
    }
});

async function authorize (auth) {
    const user = await authenticate(auth);
    return user;
}

//function notFound(req, res, next) {
//    res.status(404).send('The requested URL wasn\'t found!');
//}

function allowCORS (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
}

module.exports = api;
