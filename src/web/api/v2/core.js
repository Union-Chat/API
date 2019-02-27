const App = require('../../../app');

/**
 * Core controller
 */
class Core {
  /**
   * The / route
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static home (req, res) {
    res.send('Welcome to the Union API!');
  }

  /**
   * Sends API and app information
   * @param {Request} req HTTP request
   * @param {Response} res HTTP response
   * @returns {Promise<void>}
   */
  static info (req, res) {
    const { config } = App.getInstance();

    res.send({
      apiVersion: 2,
      ports: config.ports,
      settings: config.settings,
      recaptcha: {
        enabled: !!config.services.recaptcha,
        key: config.services.recaptcha ? config.services.recaptcha.key : undefined
      },
      sentry: {
        enabled: !!config.services.sentry,
        key: config.services.sentry ? config.services.sentry.key : undefined
      },
      discord: !!config.apps.discord,
      github: !!config.apps.github,
      spotify: !!config.apps.spotify,
      reddit: !!config.apps.reddit
    });
  }
}

module.exports = Core;
