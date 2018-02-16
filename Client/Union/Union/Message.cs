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

            Dock = DockStyle.Bottom;
        }
    }
}
