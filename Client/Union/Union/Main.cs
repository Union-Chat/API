using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Union
{
    public partial class Main : Form
    {

        public int selectedServer;

        public Main()
        {
            InitializeComponent();
        }

        public void AddServers(JArray servers)
        {
            Invoke(new Action(() => panel1.Controls.Clear()));
            foreach (JObject server in servers)
            {
                //Console.WriteLine(server);
                Button b = new Button()
                {
                    Height = panel1.Width,
                    Dock = DockStyle.Top,
                    BackColor = Color.FromArgb(50, 50, 50),
                    FlatStyle = FlatStyle.Flat
                };

                b.FlatAppearance.BorderSize = 0;
                b.Tag = (int)server.Property("id").Value;
                b.Text = server.Property("name").Value.ToString();
                b.ForeColor = Color.White;
                b.MouseClick += OnServerSwitch;

                Invoke(new Action(() => panel1.Controls.Add(b)));
            }
        }

        public void AddMembers(JArray members)
        {
            Invoke(new Action(() => Members.Controls.Clear()));
            foreach (JObject member in members)
            {
                Member m = new Member((int)member.Property("id").Value, member.Property("name").Value.ToString(), (bool)member.Property("online").Value);
                Invoke(new Action(() => Members.Controls.Add(m))); 
            }
        }

        public void UpdatePresence(int userId, bool online)
        {
            Member m = Members.Controls.OfType<Member>().FirstOrDefault(member => member.id == userId);
            if (m != null)
                m.setPresence(online);
        }

        private void OnServerSwitch(Object sender, MouseEventArgs e)
        {
            Button b = (Button)sender;

            if (selectedServer == (int)b.Tag)
                return;

            b.BackColor = Color.FromArgb(70, 70, 70);
            Text = $"Union - {b.Text}";
            selectedServer = (int)b.Tag;

            messages.Controls.Clear();
            List<Message> msgs = ClientManager.GetMessagesFor(selectedServer);
            if (msgs?.Count > 0)
                messages.Controls.AddRange(msgs.ToArray());

            ClientManager.GetMembersFor(selectedServer);

            textBox1.Enabled = true;
            textBox1.Text = "Send a message...";

            foreach (Button server in panel1.Controls)
            {
                if (server != b)
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
                ClientManager.ws.Send(Encoding.ASCII.GetBytes(compiled));
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

            if (ClientManager.ws.IsAlive)
                ClientManager.ws.Close();
            
        }

        private void messages_ControlAdded(object sender, ControlEventArgs e)
        {
            messages.AutoScrollPosition = new Point(0, messages.VerticalScroll.Maximum);
        }
    }
}
