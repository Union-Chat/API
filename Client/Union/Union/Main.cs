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

        public void AddServers(JArray servers)
        {
            Invoke(new Action(() => panel1.Controls.Clear()));
            foreach (JObject server in servers)
            {
                Server s = new Server(server.Property("name").Value.ToString(), (int)server.Property("id").Value, panel1.Width);
                s.MouseClick += OnServerSwitch;

                Invoke(new Action(() => panel1.Controls.Add(s)));
            }
        }

        public void AddMembers(JArray members)
        {
            Invoke(new Action(() => Members.Controls.Clear()));
            foreach (JObject member in members)
            {
                Member m = new Member(member.Property("id").Value.ToString(), (bool)member.Property("online").Value);
                Invoke(new Action(() => Members.Controls.Add(m))); 
            }
        }

        public void UpdatePresence(string userId, bool online)
        {
            Member m = Members.Controls.OfType<Member>().FirstOrDefault(member => member.id.Equals(userId));
            if (m != null)
                m.setPresence(online);
        }

        public void DeleteMessage(string id)
        {
            Control ctl = messages.Controls.OfType<Message>().Where(m => m.Id == id).First();

            if (ctl != null)
            {
                messages.Invoke(new Action(() => messages.Controls.Remove(ctl)));
            }
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
            List<Message> msgs = ClientManager.GetMessagesFor(selectedServer);
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
            panel1.Controls.Clear();
            messages.Controls.Clear();
            Members.Controls.Clear();
            ClientManager.PurgeMessageCache();
            selectedServer = 0;

            e.Cancel = true;
            Hide();

            Application.Exit();

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
    }
}
