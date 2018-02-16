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
            foreach (Form form in Application.OpenForms.Cast<Form>().ToList())
                form.Dispose();

            if (ClientManager.ws.IsAlive)
                ClientManager.ws.Close();

            Application.Exit();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            ClientManager.Connect(textBox1.Text, textBox2.Text);
            textBox2.Clear();
            Hide();
        }

        private void textBox1_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == Convert.ToChar(Keys.Enter) && !ModifierKeys.HasFlag(Keys.Shift))
                button1.PerformClick();
        }
    }
}
