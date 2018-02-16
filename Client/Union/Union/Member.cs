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
        public string name = "";
        public int id = 0;

        public Member(int id, string name, bool online)
        {
            InitializeComponent();

            this.online = online;
            this.id = id;
            label1.Text = this.name = name;

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
