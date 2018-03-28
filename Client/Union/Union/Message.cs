using Newtonsoft.Json;
using System;
using System.Drawing;
using System.Windows.Forms;

namespace Union
{
    public partial class Message : UserControl
    {
        private bool isSelfMessage = false;
        public string Id { get; }

        public Message(String author, String content, Boolean self, string id)
        {
            InitializeComponent();
            Id = id;
            isSelfMessage = self;
            String ct = content.Replace("\r\n", Environment.NewLine).Replace("\n", Environment.NewLine);

            Username.Text = author;
            Content.Text = ct;

            Dock = DockStyle.Bottom;
        }

        public void Delete()
        {
            Parent.Invoke(new Action(() => Parent.Controls.Remove(this)));
        }

        private void Delete_Click(object sender, EventArgs e)
        {
            IWSMessage m = new IWSMessage()
            {
                op = (int)ClientManager.OPCODES.DeleteMessage,
                d = Id
            };
            ClientManager.ws.Send(JsonConvert.SerializeObject(m));
        }

        private void Username_Paint(object sender, PaintEventArgs e)
        {
            DeleteBtn.Visible = isSelfMessage;

            using (Graphics g = CreateGraphics())
            {
                float height = g.MeasureString(Content.Text, Content.Font, Content.Width).Height + Username.Height + 20;
                Height = (int)Math.Round(height);
            }
        }
    }

}
