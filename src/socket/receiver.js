import logger from '../logger';
import opcodes from '../../opcodes';
import { deduplicate } from '../utils';
import { authenticate } from '../database';
import { handlePresenceUpdate } from '../events';
import { dispatchOk, dispatchHello } from './dispatcher';

const events = ['USER_UPDATE', 'PRESENCE_UPDATE', 'SERVER_CREATE', 'SERVER_UPDATE', 'SERVER_DELETE', 'SERVER_MEMBER_JOIN', 'SERVER_MEMBER_LEAVE', 'SERVER_MEMBERS_CHUNK', 'MESSAGE_CREATE', 'MESSAGE_UPDATE', 'MESSAGE_DELETE'];

export default async function (client, data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    return client.close(4002, 'Malformed payload (invalid JSON)');
  }

  if (data.op === undefined || data.d === undefined) {
    return client.close(4002, 'Malformed payload (missing op and/or data)');
  }

  switch (data.op) {
    case opcodes.Authenticate:
      await handleAuthenticate(client, data.d);
      break;
    case opcodes.Subscribe:
      handleSubscribe(client, data.d);
      break;
    case opcodes.Unsubscribe:
      handleUnsubscribe(client, data.d);
      break;
    case opcodes.RequestMembers:
      // @todo
      break;
    default:
      client.close(4003, 'Unknown opcode. Please refer to the documentation for a list of opcodes');
      break;
  }
}

async function handleAuthenticate (client, data) {
  if (client.isAuthenticated) {
    return client.close(4001, 'You\'re already authenticated!');
  }
  if ('string' !== typeof data) {
    return client.close(4001, 'Invalid data');
  }
  if (!data.startsWith('Basic ') /* && !data.d.startsWith('Bearer ') && !data.d.startsWith('Bot ') */) {
    return client.close(4001, 'Invalid token type');
  }

  const user = await authenticate(data);
  if (!user) {
    return client.close(4001, 'Invalid credentials');
  }

  logger.info('Client connected\n\t{0}\n\t{1} clients connected', user.id, global.server.clients.size);
  client._un = user.id;
  client.user = user;
  client.isAlive = true;
  client.isAuthenticated = true;
  client.subscriptions = events;
  // if (user.bot) {
  //   client.subscriptions = []
  // }

  await dispatchHello(client);
  await handlePresenceUpdate(client.user.id);
}

function handleSubscribe (client, data) {
  if (0 === data.length) {
    client.subscriptions = events;
  } else {
    if (data.filter(d => -1 !== events.indexOf(d)).length !== data.length) {
      return client.close(4002, 'You passed an invalid event');
    }
    client.subscriptions = deduplicate(client.subscriptions, ...data);
  }
  dispatchOk(client);
}

function handleUnsubscribe (client, data) {
  if (0 === data.length) {
    client.subscriptions = [];
  } else {
    if (data.filter(d => -1 !== events.indexOf(d)).length !== data.length) {
      return client.close(4002, 'You passed an invalid event');
    }
    client.subscriptions = client.subscriptions.filter(s => -1 === data.indexOf(s));
  }

  if (0 === client.subscriptions.length) {
    global.__socketSubTimeouts.push(setTimeout(() => {
      if (0 === client.subscriptions.length) {
        client.close(4006, 'You\'re not subscribed to anything for too long');
      }
    }, 30e3));
  }
  dispatchOk(client);
}
