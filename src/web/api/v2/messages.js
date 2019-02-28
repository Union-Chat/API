const App = require('../../../app');
const Dispatcher = require('../../../socket/dispatcher');

/**
 * Messages controller
 * @todo: Advanced fetching (Arround #id, in channel, searching?)
 * @todo: Reaction
 * @todo: Snipes
 * @todo: Embeds/Integrated messages (Reddit/Twitter/GitHub/...)
 * @todo: Filter messages (filter classic ads/integrate Perspective API)
 */
class Messages {
  //*******************//
  // Server Management //
  //*******************//
  /**
   * Posts a message
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async create (req, res) {
    const { serverId } = req;
    const { content } = req.body;

    if (!req.user.servers.includes(serverId)) {
      return res.status(403).json({ error: 'You cannot send messages to this server' });
    }

    if (!content || 0 === content.trim().length) {
      return res.status(400).json({ error: 'Content must be a non empty string' });
    }

    if (content.length > App.getInstance().config.settings.messageCharacterLimit) {
      return res.status(400).json({ error: `Content cannot exceed ${App.getInstance().config.settings.messageCharacterLimit} characters` });
    }

    const message = await App.getInstance().db.messages.create(req.user._id, serverId, content);
    res.json(message);

    const clients = App.getInstance().socket.getClientsByServerID(req.serverId);
    Dispatcher.messageCreate(clients, message);
  }

  /**
   * Edits a message
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async patch (req, res) {
    const { serverId } = req;
    const { content } = req.body;
    const message = await App.getInstance().db.messages.find(req.params.messageId, serverId);

    if (!message) {
      return res.sendStatus(404);
    }

    if (!req.user.servers.includes(serverId)) {
      return res.status(403).json({ error: 'You are not in the server' });
    }

    if (req.user._id !== message.author) {
      return res.status(403).json({ error: 'You are not the author of this message' });
    }

    if (!content || 0 === content.trim().length) {
      return res.status(400).json({ error: 'Content must be a string and not empty' });
    }

    if (content.length > App.getInstance().config.settings.messageCharacterLimit) {
      return res.status(400).json({ error: `Content cannot exceed ${App.getInstance().config.settings.messageCharacterLimit} characters` });
    }

    const clients = App.getInstance().socket.getClientsByServerID(req.serverId);
    Dispatcher.messageUpdate(clients, message);
  }

  /**
   * Deletes a message
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async delete (req, res) {
    const { serverId } = req;
    const message = await App.getInstance().db.messages.find(req.params.messageId, serverId);

    if (!message) {
      return res.sendStatus(404);
    }

    if (!req.user.servers.includes(serverId)) {
      return res.status(403).json({ error: 'You are not in the server' });
    }

    if (req.user._id !== message.author && !await App.getInstance().db.users.ownsServers(req.user._id, serverId)) {
      return res.status(403).json({ error: 'You are neither the author nor the server owner' });
    }

    await App.getInstance().db.messages.delete(req.params.messageId);
    res.sendStatus(204);

    const clients = App.getInstance().socket.getClientsByServerID(req.serverId);
    Dispatcher.messageDelete(clients, req.params.messageId);
  }
}

module.exports = Messages;
