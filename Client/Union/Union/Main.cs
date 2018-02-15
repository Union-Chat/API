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
        public Main()
        {
            InitializeComponent();
        }

        public void AddServers(JArray ids)
        {
            foreach (int id in ids)
            {
                Console.WriteLine(id);
                Panel p = new Panel();
                p.Height = panel1.Width;
                p.Dock = DockStyle.Top;
                p.BackColor = Color.FromArgb(30, 30, 30);
                p.Tag = id;
                panel1.Click += OnServerSwitch;

                Invoke(new Action(() => panel1.Controls.Add(p)));
            }
        }

        public void OnServerSwitch(Object sender, EventArgs e)
        {
            Console.WriteLine("clicked");
            Panel p = (Panel)sender;

            Console.WriteLine(p.Tag);
        }
    }
}
