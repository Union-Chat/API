const { resolve } = require('path');
const { writeFile } = require('fs').promises;

/**
 * @typedef UnionConfigCert
 * @property {string} cert Certificate
 * @property {string} key Private key
 */

/**
 * @typedef UnionConfigServiceKeys
 * @property {string} client Client ID
 * @property {string} secret Secret key
 */

/**
 * @typedef UnionConfigRateLimits
 * @property {string} max Max requests
 * @property {string} window Window length, in seconds
 */

/**
 * Union config manager
 * @property {object} ports Ports the app is listening to
 * @property {int} ports.web Port the express server is listening to
 * @property {int} ports.ws Port the websocket is listening to
 * @property {int} ports.voice Port the voice server is listening to
 * @property {object} certs Certificates for the app
 * @property {UnionConfigCert} certs.web Certificate for the express server
 * @property {UnionConfigCert} certs.ws Certificate for the websocket
 * @property {UnionConfigCert} certs.voice Certificate for the voice server
 * @property {object} services Client and secret keys for services used in Union
 * @property {UnionConfigServiceKeys} services.recaptcha Client and secret keys for recaptcha usage in Union
 * @property {UnionConfigServiceKeys} services.sentry Client and secret keys for Sentry usage in Union
 * @property {object} apps Client and secret keys for apps integrated in Union
 * @property {UnionConfigServiceKeys} apps.discord Client and secret keys for Discord integration in Union
 * @property {UnionConfigServiceKeys} apps.github Client and secret keys for Sentry integration in Union
 * @property {UnionConfigServiceKeys} apps.spotify Client and secret keys for Spotify integration in Union
 * @property {UnionConfigServiceKeys} apps.reddit Client and secret keys for Reddit integration in Union
 * @property {UnionConfigServiceKeys} apps.twitter Client and secret keys for Twitter integration in Union
 * @property {object} ratelimits RateLimits for Union
 * @property {UnionConfigRateLimits} ratelimits.perEndpoint Pre-endpoint RateLimits
 * @property {UnionConfigRateLimits} ratelimits.global Pre-endpoint RateLimits
 * @property {object} settings Settings for Union
 * @property {int} settings.messageCharacterLimit Max message length
 * @property {int} settings.usernameCharacterLimit Max username length
 * @property {int} settings.serverCharacterLimit Max server name length
 * @property {int} settings.maxServersPerUser Max owned servers per user
 * @property {int} settings.maxAppsPerUser Max owned apps per user
 */
class Config {
  constructor () {
    this.config = require('../config');
    Object.keys(this.config).forEach(cfg => {
      Object.defineProperty(this, cfg, {
        set: () => {
          throw new Error('You can\'t edit config at runtime!');
        },
        get: () => this.config[cfg]
      });
    });
  }

  async set (key, value) {
    this.settings[key] = value;
    this.config.settings[key] = value;
    await writeFile(resolve(__dirname, '../config.json'), JSON.stringify(this.config, null, 2));
  }
}

module.exports = Config;
