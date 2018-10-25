import WebSocket from 'ws'
import logger from '../logger'
import opcodes from '../../opcodes'
import { filter } from '../utils'
import { getServersOfUser } from '../database'

export function dispatchWelcome (client) {
  send([client], { op: opcodes.Welcome, d: 'Welcome, your papers please' })
}

export async function dispatchHello (client) {
  const servers = await getServersOfUser(client.user.id)
  send([client], { op: opcodes.Hello, d: servers })
}

export function dispatchOk (client) {
  send([client], { op: opcodes.OK })
}

export function dispatchEvent (clients, event, data) {
  clients = filter(clients, c => c.subscriptions.indexOf(event) !== -1)
  send(clients, { op: opcodes.DispatchEvent, d: data, e: event })
}

function send (clients, payload) {
  logger.debug('Dispatching OP {0} to {1} clients', payload.op, clients.size || clients.length)
  payload = JSON.stringify(payload)

  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
    }
  })
}
