const config = require('./Configuration.json');
const fs = require('fs');

const https = require('https');
const WebSocket = require('ws');

const wss = https.createServer({
  cert: fs.readFileSync(config.ws.certPath),
  key: fs.readFileSync(config.ws.keyPath),
});
const voiceSocket = new WebSocket.Server({ server: wss });
global.voiceServer = voiceSocket;


voiceSocket.on('connection', async (client, req) => {
  client.clientId = generateClientId();
  console.log(`Connection from ${client._socket.remoteAddress} (Assigned client-id ${client.clientId})`);

  client.on('message', (data) => {
    voiceSocket.clients.forEach(ws => {
      console.log(ws.clientId, client.clientId);
      if (ws.readyState === WebSocket.OPEN && ws.clientId !== client.clientId) {
        ws.send(data, {
          binary: true
        });
      }
    });
  });
});

function generateClientId () {
  let largestId = 1;

  voiceSocket.clients.forEach(ws => {
    if (ws.clientId && ws.clientId > largestId) {
      largestId = ws.clientId;
    }
  });

  return largestId + 1;
}

function start () {
  wss.listen(config.voicews.port, () => {
    console.log(`[VWS] Voice WebSocket started on port ${config.voicews.port}`);
  });
}

function shutdown () {
  wss.close();
}

module.exports = {
  start,
  shutdown
};
