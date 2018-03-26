using System;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Windows.Forms;


namespace Union
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button2_Click(object sender, EventArgs e)
        {
            foreach (Form form in Application.OpenForms.Cast<Form>().ToList())
                form.Invoke(new Action(() => form.Dispose()));

            if (ClientManager.ws?.State == WebSocket4Net.WebSocketState.Open)
                ClientManager.ws.Close();

            Application.Exit();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            ClientManager.Connect(textBox1.Text, textBox2.Text);
            textBox2.Clear();
            Dispose();
        }

        private void textBox1_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == Convert.ToChar(Keys.Enter) && !ModifierKeys.HasFlag(Keys.Shift))
                button1.PerformClick();
        }

        private void Form1_Shown(object sender, EventArgs e)
        {
            textBox1.Focus();
        }

        private void button3_Click(object sender, EventArgs e)
        {
            Process.Start("http://162.212.157.37:42069/");
        }
    }
}
