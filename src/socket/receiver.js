const { Receiver: ReceiverV2 } = require('./v2');

/**
 * Dispatches a payload to the corresponding receiver depending on client version
 * @param {UnionClient} client The client who sent the payload
 * @param {string} payload Raw payload
 */
function handle (client, payload) {
  switch (client.version) {
    case 2: ReceiverV2.handle(client, payload);
  }
}

module.exports = handle;
