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
    public partial class Member : UserControl
    {

        public bool online = false;
        public string id = "";

        public Member(string id, bool online)
        {
            InitializeComponent();

            this.online = online;
            label1.Text = this.id = id;

            setPresence(online);
            Dock = DockStyle.Top;
        }

        public void setPresence(bool online)
        {
            this.online = online;

            if (online)
            {
                if (label2.InvokeRequired)
                    Invoke(new Action(() => label2.Text = "Online"));
                else
                    label2.Text = "Online";
            }
            else
            {
                if (label2.InvokeRequired)
                    Invoke(new Action(() => label2.Text = "Offline"));
                else
                    label2.Text = "Offline";
            }
        }
    }
}
