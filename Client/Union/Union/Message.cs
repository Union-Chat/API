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
            Username.Text = author;
            Content.Text = content.Replace("\n", Environment.NewLine);
            if (Username.Text == "SYSTEM")
            {
                this.Height = 50;
                if (Content.Text.Contains(" is online"))
                    Content.ForeColor = Color.LawnGreen;
                else if (Content.Text.Contains(" is offline"))
                    Content.ForeColor = Color.Orange;
            }
            Dock = DockStyle.Bottom;
        }
    }
}
