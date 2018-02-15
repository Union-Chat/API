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
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
            ClientManager.client = new Main();
            ClientManager.client.Show();
            ClientManager.client.Hide();
        }

        private void button2_Click(object sender, EventArgs e)
        {
            Application.Exit();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            ClientManager.Connect(textBox1.Text, textBox2.Text);
            Hide();
        }
    }
}
