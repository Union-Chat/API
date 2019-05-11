const { compare } = require('bcrypt');
const querystring = require('querystring');

const App = require('../../app');
const Dispatcher = require('../../socket/dispatcher');

/**
 * Users controller
 * @todo: Relationships
 * @todo: DM Channel (depends on channels)
 * @todo: Get profiles
 * @todo: Connections
 * @todo: User settings
 */
class Users {
  //********************//
  // Account Management //
  //********************//
  /**
   * Creates an user
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async create (req, res) {
    const { username, password } = req.body;

    if (App.getInstance().config.services.recaptcha) {
      const gRecaptchaResponse = req.body['g-recaptcha-response'];
      if (!gRecaptchaResponse) {
        return res.status(400).json({ error: 'reCAPTCHA is missing' });
      }

      const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: querystring.encode({
          response: gRecaptchaResponse,
          secret: App.getInstance().config.services.recaptcha.secret,
          remoteip: req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress
        })
      });
      const json = await resp.json();

      if (!json.success) {
        return res.status(400).json({ error: 'reCAPTCHA check failed' });
      }
    }

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username cannot be empty' });
    }

    if (username.trim().length > App.getInstance().config.settings.usernameCharacterLimit) {
      return res.status(400).json({ error: `Username cannot exceed ${App.getInstance().config.settings.usernameCharacterLimit} characters` });
    }

    if ([ ':', '#' ].some(char => username.includes(char))) {
      return res.status(400).json({ error: 'Your username contains prohibited characters' });
    }

    if (!password || password.length < 5) {
      return res.status(400).json({ error: 'Password cannot be empty and must be 5 characters long or more' });
    }

    // Save data
    const user = await App.getInstance().db.users.create(username, password);
    delete user.password;
    res.json(user);
  }

  /**
   * Gets the current user
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   */
  static getSelf (req, res) {
    delete req.user.password;
    res.json(req.user);
  }

  /**
   * Updates the current user details
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async patch (req, res) {
    const { password, username, newPassword, avatarUrl } = req.body;
    const updates = {};
    if (!password || !await compare(password, req.user.password)) {
      return res.sendStatus(403);
    }

    if (username !== undefined) {
      if (username.trim().length === 0) {
        return res.status(400).json({ error: 'Username cannot be empty' });
      }

      if (username.trim().length > App.getInstance().config.settings.usernameCharacterLimit) {
        return res.status(400).json({ error: `Username cannot exceed ${App.getInstance().config.settings.usernameCharacterLimit} characters` });
      }

      if ([ ':', '#' ].some(char => username.includes(char))) {
        return res.status(400).json({ error: 'Your username contains prohibited characters' });
      }

      updates.username = username;
    }

    if (newPassword !== undefined) {
      if (newPassword.length < 5) {
        return res.status(400).json({ error: 'Password cannot be empty and must be 5 characters long or more' });
      }

      updates.password = username;
    }

    if (avatarUrl !== undefined) {
      // @todo: Checking, and maybe allow file uploading instead of just linking, to protect end users IPs.
      updates.avatarUrl = avatarUrl;
    }

    const newUser = await App.getInstance().db.users.update(req.user._id, updates);
    res.status(200).send(newUser);

    // Socket stuff
    if (updates.password) {
      App.getInstance().socket.getClientsByUserID(req.user._id).forEach(client => {
        client.ws.close(4004, 'Password changed');
      });
    }

    const clients = App.getInstance().socket.clients.filter(client =>
      !!(client.user && client.user.servers && client.user.servers.find(s => req.user.servers.includes(s)))
    );
    Dispatcher.userUpdate(clients, newUser);
  }

  /**
   * Deletes the current account
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async delete (req, res) {
    const { password } = req.body;
    if (!password || !await compare(password, req.user.password)) {
      return res.sendStatus(403);
    }

    await App.getInstance().db.users.delete(req.user._id);
    res.sendStatus(204);

    req.user.servers.forEach(async serverId => {
      const members = await App.getInstance().db.servers.findUsers(serverId);
      const clients = members.map(m => App.getInstance().socket.getClientsByUserID(m._id)).reduce((a, b) => [ ...a, ...b ], []);
      Dispatcher.serverMemberLeave(clients, serverId, req.user._id);
    });
  }
}

module.exports = Users;
