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
  console.log(`Connection from ${client._socket.remoteAddress}`);
  client.on('message', (data) => {
    voiceSocket.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {// && ws !== client) {
        client.send(data, {
          binary: true
        });
      }
    });
  });
});


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
