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
            foreach (JObject server in servers)
            {
                Button b = new Button()
                {
                    Height = panel1.Width,
                    Dock = DockStyle.Top,
                    BackColor = Color.FromArgb(30, 30, 30),
                    FlatStyle = FlatStyle.Flat
                };

                b.Tag = (int)server.Property("id").Value;
                b.Text = server.Property("name").Value.ToString();
                b.ForeColor = Color.White;
                b.MouseClick += OnServerSwitch;

                Invoke(new Action(() => panel1.Controls.Add(b)));
            }
        }

        private void OnServerSwitch(Object sender, MouseEventArgs e)
        {
            Button b = (Button)sender;
            Text = $"Union - {b.Text}";

            selectedServer = (int)b.Tag;
            messages.Controls.Clear();
            messages.Controls.AddRange(ClientManager.GetMessagesFor(selectedServer).ToArray());

            textBox1.Enabled = true;
            textBox1.Text = "Send a message...";
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
            ClientManager.Purge();

            e.Cancel = true;
            Hide();

            if (ClientManager.ws.IsAlive)
                ClientManager.ws.Close();
            
        }
    }
}
