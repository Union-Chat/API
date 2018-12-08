import config from '../../Configuration';

import fetch from 'node-fetch';
import { compare } from 'bcrypt';
import { filter, getClientsById } from '../utils';
import { dispatchEvent } from '../socket/dispatcher';
import { createUser, deleteUser, getUser, updateUser } from '../database';

export async function create (req, res) {
  const { username, password } = req.body;

  if (config.recaptcha && 'test' !== process.env.NODE_ENV) {
    const gRecaptchaResponse = req.body['g-recaptcha-response'];
    if (!gRecaptchaResponse) {
      return res.status(400).json({ error: 'reCAPTCHA is missing' });
    }

    const response = await (await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: encodeURI(`secret=${config.recaptcha.secret}&response=${gRecaptchaResponse}&remoteip=${req.headers['cf-connecting-ip']}` || req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    })).json();

    if (!response.success) {
      return res.status(400).json({ error: 'reCAPTCHA check failed' });
    }
  }

  // Validate data
  if (!username || 0 === username.trim().length) {
    return res.status(400).json({ error: 'Username cannot be empty' });
  }

  if (username.trim().length > config.rules.usernameCharacterLimit) {
    return res.status(400).json({ error: `Username cannot exceed ${config.rules.usernameCharacterLimit} characters` });
  }

  if ([':', '#'].some(char => username.includes(char))) {
    return res.status(400).json({ error: 'Your username contains prohibited characters' });
  }

  if (!password || 5 > password.length) {
    return res.status(400).json({ error: 'Password cannot be empty and must be 5 characters long or more' });
  }

  // Save data
  createUser(username.trim(), password)
    .then(id => res.status(200).json({ id }))
    .catch(err => res.status(400).json({ error: err.message }));
}

export async function getSelf (req, res) {
  res.json(Object.assign({}, req.user, { password: undefined }));
}

export async function patch (req, res) {
  const { password, username, newPassword, avatarUrl } = req.body;
  if (!password || !await compare(password, req.user.password)) {
    return res.sendStatus(401);
  }

  if (username !== undefined) {
    if (0 === username.trim().length) {
      return res.status(400).json({ error: 'Username cannot be empty' });
    }

    if (username.trim().length > config.rules.usernameCharacterLimit) {
      return res.status(400).json({ error: `Username cannot exceed ${config.rules.usernameCharacterLimit} characters` });
    }

    if ([':', '#'].some(char => username.includes(char))) {
      return res.status(400).json({ error: 'Your username contains prohibited characters' });
    }
  }

  if (undefined !== newPassword && 5 > newPassword.length) {
    return res.status(400).json({ error: 'Password cannot be empty and must be 5 characters long or more' });
  }

  const newUser = await updateUser(req.user.id, username || req.user.username, newPassword, avatarUrl);
  res.status(200).send(newUser);

  if (global.server) {
    if (newPassword !== password) {
      getClientsById(global.server.clients, req.user.id).forEach(ws => ws.close(4004, 'Password changed'));
    }

    const serverIds = req.user.servers.map(s => s.id);
    const clients = filter(global.server.clients, c => 0 !== c.user.servers.filter(s => -1 !== serverIds.indexOf(s.id)).length);
    dispatchEvent(clients, 'USER_UPDATE', await getUser(newUser));
  }
}

export async function remove (req, res) {
  const { password } = req.body;
  if (!password || !await compare(password, req.user.password)) {
    return res.sendStatus(401);
  }

  await deleteUser(req.user.id);
  res.sendStatus(204);
}
