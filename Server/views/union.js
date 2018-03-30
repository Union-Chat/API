const boldRegex = /(\*\*).+(\*\*)/g;

let ws = null;
let selectedServer = null;

window.onload = requestUsername;

function requestUsername() {
    const username = prompt('Please enter your Union username');

    if (username.length === 0) {
        return requestUsername();
    } else {
        requestPassword(username);
    }
}

function requestPassword(username) {
    const password = prompt('Please enter your Union password');

    if (password.length === 0) {
        return requestPassword(username);
    } else {
        connect(username, password);
    }
}

function connect(username, password) {
    ws = new WebSocket(`ws://union.serux.pro:2082`);
    ws.onopen = () => authenticateClient(username, password); // Stupid JS Websocket doesn't support headers REEEEEEEEE
    ws.onclose = handleWSClose;
    ws.onmessage = handleWSMessage;
}

function authenticateClient(username, password) {
    const b64 = btoa(`${username}:${password}`); // Encode to base64
    ws.send(`Basic ${b64}`);
}

function handleWSClose(close) {
    alert(`Disconnected from Union (${close.code}): ${close.reason}`);
}

function handleWSMessage(message) {
    try {
        const j = JSON.parse(message.data);

        if (j.op === 1) {
            const chatbox = document.getElementById('whatthefuckdidyoujustsayaboutme');
            chatbox.addEventListener('keydown', snedMeHarder);

            j.d.forEach(server => {
                const s = document.createElement('div');
                s.setAttribute('class', 'server');
                s.setAttribute('server-id', server.id);
                s.setAttribute('server-name', server.name);

                const icon = document.createElement('img');
                icon.setAttribute('src', server.iconUrl);

                icon.addEventListener('click', () => switchServer(s));

                s.appendChild(icon);

                document.getElementById('servers').appendChild(s);
            });
        }

        if (j.op === 3) {
            if (j.d.server !== selectedServer) {
                return;
            }

            const m = document.createElement('div');
            m.setAttribute('class', 'message');

            const author = document.createElement('h2');
            author.innerText = j.d.author;

            const content = document.createElement('div');
            let filtered = j.d.content.replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace('\r\n', '<br>')
                .replace(/\n/g, '<br>');

            for (let emoji of emojis) {
                while (filtered.includes(emoji[0])) {
                    const img = `<img src="${emoji[1]}">`; // this website employs a lot of bad practices atm
                    filtered = filtered.replace(emoji[0], img);
                }
            }
            content.innerHTML = filtered;

            m.appendChild(author);
            m.appendChild(content);

            const container = document.getElementById('message-container');
            container.appendChild(m);
            container.scrollTop = container.scrollHeight;
        }
    } catch(e) {
        console.log(e);
    }
}

function snedMeHarder(event) {
    const elemelon = document.getElementById('whatthefuckdidyoujustsayaboutme');
    const msg = elemelon.value.trim();

    if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault();
        if (ws !== null && ws.readyState === WebSocket.OPEN && msg.length > 0) {
            const payload = {
                op: 8,
                d: {
                    server: 1,
                    content: msg
                }
            }

            ws.send(JSON.stringify(payload));
            elemelon.value = '';
        }
    }
}

function switchServer(server) {
    const chatbox = document.getElementById('whatthefuckdidyoujustsayaboutme');
    const id = server.getAttribute('server-id');
    const name = server.getAttribute('server-name');
    selectedServer = Number(id);

    chatbox.removeAttribute('readonly');
    chatbox.setAttribute('placeholder', `Message ${name}...`);
}

const emojis = new Map([
    [':thinkman:', 'https://cdn.discordapp.com/emojis/427561917989650444.png?v=1'],
    [':sad:', 'https://cdn.discordapp.com/emojis/409499960128569346.png?v=1'],
    [':eyes:', 'https://canary.discordapp.com/assets/ccf4c733929efd9762ab02cd65175377.svg'],
    [':mmspin:', 'https://cdn.discordapp.com/emojis/422820729042763777.gif?v=1']
]);
