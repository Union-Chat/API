const App = require('../../app');
const Dispatcher = require('../../socket/dispatcher');

/**
 * Servers controller
 * @todo: Create/Get/Update/Delete channels (depends on channels impl)
 * @todo: Move message handling to channels
 * @todo: Manage invites
 * @todo: Roles & Permissions
 * @todo: Moderation (mute/kick/ban)
 * @todo: Audit logs
 * @todo: Make deleting a server delete everything related to it
 */
class Servers {
  //*******************//
  // Server Management //
  //*******************//
  /**
   * Creates a server
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async create (req, res) {
    const { name } = req.body;
    if (!name || 0 === name.trim().length) {
      return res.status(400).json({ error: 'Server name cannot be empty' });
    }

    if (name.trim().length > App.getInstance().config.settings.serverCharacterLimit) {
      return res.status(400).json({ error: `Server name cannot exceed ${App.getInstance().config.settings.serverCharacterLimit} characters` });
    }

    if (await App.getInstance().db.users.findOwnedServers(req.user._id).length >= App.getInstance().config.settings.maxServersPerUser) {
      return res.status(400).json({ error: `You cannot own more than ${App.getInstance().config.settings.maxServersPerUser} servers` });
    }

    const server = await App.getInstance().db.servers.create(name, req.user._id);
    res.json(server);

    const clients = App.getInstance().socket.getClientsByUserID(req.user._id);
    Dispatcher.serverCreate(clients, server);
  }

  /**
   * Updates the current server details
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async patch (req, res) {
    const { name, iconUrl } = req.body;

    if (!await App.getInstance().db.users.ownsServers(req.user._id, req.serverId)) {
      return res.status(403).json({ error: 'You don\'t own this server' }); // @todo: perms
    }

    const updates = {};
    if (name !== undefined) {
      if (0 === name.trim().length) {
        return res.status(400).json({ error: 'Server name cannot be empty' });
      }

      if (name.trim().length > config.rules.serverCharacterLimit) {
        return res.status(400).json({ error: `Server name cannot exceed ${config.rules.serverCharacterLimit} characters` });
      }

      updates.name = name;
    }

    if (undefined !== iconUrl) {
      // @todo: Checking, and maybe allow file uploading instead of just linking, to protect end users IPs.
      updates.iconUrl = iconUrl;
    }

    const server = await App.getInstance().db.servers.update(req.serverId, updates);
    res.json(server);

    const clients = App.getInstance().socket.getClientsByServerID(req.serverId);
    Dispatcher.serverUpdate(clients, server);
  }

  /**
   * Deletes the current server
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async delete (req, res) {
    if (!await App.getInstance().db.users.ownsServers(req.user._id, req.serverId)) {
      return res.status(403).json({ error: 'You can only delete servers that you own' });
    }

    await App.getInstance().db.servers.delete(req.serverId);
    res.sendStatus(204);

    const clients = App.getInstance().socket.getClientsByServerID(req.serverId);
    Dispatcher.serverDelete(clients, req.serverId);
  }

  //*********//
  // Members //
  //*********//
  /**
   * Makes an user leave the server
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async leave (req, res) {
    const { serverId } = req;

    if (!await App.getInstance().db.users.isInServer(req.user._id, serverId)) {
      return res.status(400).json({ error: 'You are not in that server' });
    }

    if (await App.getInstance().db.users.ownsServers(req.user._id, serverId)) {
      return res.status(400).json({ error: 'You cannot leave a server that you own' });
    }

    await App.getInstance().db.users.leaveServer(req.user._id, serverId);
    res.sendStatus(204);

    const selfClients = App.getInstance().socket.getClientsByUserID(req.user._id);
    Dispatcher.serverDelete(selfClients, req.serverId);

    const clients = App.getInstance().socket.getClientsByServerID(req.serverId);
    Dispatcher.serverMemberLeave(clients, req.serverId, req.user._id);
  }
}

module.exports = Servers;
