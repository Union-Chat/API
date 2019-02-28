const App = require('../../../app');
const Dispatcher = require('../../../socket/dispatcher');

/**
 * Invites controller
 * @todo: Advanced invites (Expiration, limits, join tracking)
 * @todo: Get/Edit/Delete invites
 */
class Invites {
  /**
   * Creates an invite
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async create (req, res) {
    const { serverId } = req;

    if (!await App.getInstance().db.users.ownsServers(req.user._id, serverId)) {
      return res.status(403).json({ error: 'Only the server owner can generate invites' });
    }

    const invite = await App.getInstance().db.invites.create(serverId);
    res.json(invite);
  }

  /**
   * Accepts an invite
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static async accepts (req, res) {
    const invite = await App.getInstance().db.invites.find(req.params.inviteId);

    if (!invite) {
      return res.status(404).json({ error: 'Unknown invite' });
    }

    const { server: serverId } = invite;
    const server = await App.getInstance().db.servers.find(invite.server);
    if (!server) {
      return res.status(404).json({ error: 'Invite expired (Server has been deleted)' });
    }

    if (await App.getInstance().db.users.isInServer(req.user._id, serverId)) {
      return res.status(400).json({ error: 'You\'re already in this server' });
    }

    await App.getInstance().db.users.joinServer(req.user._id, serverId);
    res.sendStatus(204);

    const selfClients = await App.getInstance().socket.getClientsByUserID(req.user._id);
    Dispatcher.serverCreate(selfClients, server);

    const clients = App.getInstance().socket.getClientsByServerID(req.serverId).filter(c => c.user._id !== req.user._id);
    Dispatcher.serverMemberJoin(clients, req.serverId, req.user._id);
  }
}

module.exports = Invites;
