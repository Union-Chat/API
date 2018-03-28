using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;

namespace Union
{
    public partial class Main : Form
    {

        private Dictionary<int, List<Message>> messageCache = new Dictionary<int, List<Message>>();
        public int selectedServer;

        protected override CreateParams CreateParams
        {
            get
            {
                var cp = base.CreateParams;
                cp.ExStyle |= 0x02000000;  // Windows flag that makes this form render off-screen to reduce flickering
                return cp;
            }
        }

        public Main()
        {
            InitializeComponent();
        }

        public List<Message> GetMessagesFor(int server)
        {
            List<Message> messages = new List<Message>();
            messageCache.TryGetValue(server, out messages);
            return messages;
        }

        public void CacheMessage(int server, Message m)
        {
            if (!messageCache.ContainsKey(server))
                messageCache.Add(server, new List<Message>());

            messageCache[server].Add(m);
            messages.Invoke(new Action(() =>
            {
                messages.SuspendLayout();
                messages.Controls.Add(m);
                messages.ResumeLayout();
            }));
        }

        public void AddServers(JArray servers)
        {
            Invoke(new Action(() =>
            {
                panel1.SuspendLayout();
                panel1.Controls.Clear();
                foreach (JObject server in servers)
                {
                    Server s = new Server(server.Property("name").Value.ToString(), (int)server.Property("id").Value, panel1.Width);
                    s.MouseClick += OnServerSwitch;
                    panel1.Controls.Add(s);
                }
                panel1.ResumeLayout();
            }));
        }

        public void AddMembers(JArray members)
        {
            Invoke(new Action(() =>
            {
                Members.SuspendLayout();
                Members.Controls.Clear();
                members = new JArray(members.OrderByDescending(m => (string)m["id"]));
                foreach (JObject member in members)
                {
                    Member m = new Member(member.Property("id").Value.ToString(), (bool)member.Property("online").Value);
                    Members.Controls.Add(m);
                }
                Members.ResumeLayout();
            }));
        }

        public void UpdatePresence(string userId, bool online)
        {
            Members.Controls
                .OfType<Member>()
                .FirstOrDefault(member => member.id.Equals(userId))
                ?.setPresence(online);
        }

        public void DeleteMessage(string id)
        {
            messages.Controls
                .OfType<Message>()
                .FirstOrDefault(msg => msg.Id == id)
                ?.Delete();
        }

        private void OnServerSwitch(Object sender, MouseEventArgs e)
        {
            Server s = (Server)sender;

            if (selectedServer == s.Id)
                return;

            s.BackColor = Color.FromArgb(60, 60, 60);
            Text = $"Union - {s.FullName}";
            selectedServer = s.Id;

            messages.Controls.Clear();
            List<Message> msgs = GetMessagesFor(selectedServer);
            if (msgs?.Count > 0)
                messages.Controls.AddRange(msgs.ToArray());

            ClientManager.GetMembersFor(selectedServer);

            textBox1.Enabled = true;

            foreach (Server server in panel1.Controls)
            {
                if (server != s)
                    server.BackColor = Color.FromArgb(50, 50, 50);
            }
        }

        private void textBox1_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == Convert.ToChar(Keys.Enter) && !ModifierKeys.HasFlag(Keys.Shift))
            {
                e.Handled = true;

                if (String.IsNullOrWhiteSpace(textBox1.Text))
                    return;

                IWSMessage msg = new IWSMessage()
                {
                    op = (int)ClientManager.OPCODES.Message,
                    d = new IMessage(selectedServer, textBox1.Text)
                };

                string compiled = JsonConvert.SerializeObject(msg);
                ClientManager.ws.Send(compiled);
                textBox1.Clear();
            }
        }

        private void Main_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (ClientManager.ws.State == WebSocket4Net.WebSocketState.Open)
                ClientManager.ws.Close();
        }

        private void messages_ControlAdded(object sender, ControlEventArgs e)
        {
            messages.AutoScrollPosition = new Point(0, messages.VerticalScroll.Maximum);
        }

        private void messages_ControlRemoved(object sender, ControlEventArgs e)
        {
            messages.AutoScrollPosition = new Point(0, messages.VerticalScroll.Maximum);
        }

        private void textBox1_Enter(object sender, EventArgs e)
        {
            textBox1.BackColor = Color.FromArgb(90, 90, 90);
        }

        private void textBox1_Leave(object sender, EventArgs e)
        {
            textBox1.BackColor = Color.FromArgb(70, 70, 70);
        }

        private void textBox1_TextChanged(object sender, EventArgs e)
        {
            using (Graphics g = textBox1.CreateGraphics())
            {
                int height = (int)g.MeasureString(textBox1.Text, textBox1.Font, textBox1.Width).Height;
                textBox1.Height = height + 9;
            }
        }
    }
}
