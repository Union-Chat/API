using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Union
{
    public partial class Message : UserControl
    {
        public Message(String author, String content)
        {
            InitializeComponent();
            String ct = content.Replace("\n", Environment.NewLine);

            Username.Text = author;
            Content.Text = ct;

            Dock = DockStyle.Bottom;
        }

        private void Username_Paint(object sender, PaintEventArgs e)
        {
            using (Graphics g = CreateGraphics())
            {
                float height = g.MeasureString(Content.Text, Content.Font).Height + Username.Height + 20;
                Height = (int)Math.Round(height);
            }
        }
    }

}
