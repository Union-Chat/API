using System;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Windows.Forms;


namespace Union
{
    public partial class Form1 : Form
    {

        public Point mousePos;

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
            if (String.IsNullOrEmpty(textBox1.Text))
            {
                MessageBox.Show("Username cannot be empty!");
                return;
            }

            if (String.IsNullOrEmpty(textBox2.Text))
            {
                MessageBox.Show("Password cannot be empty!");
                return;
            }

            if (textBox1.Text.Length > 15)
            {
                MessageBox.Show("Username cannot be longer than 15 characters!");
                return;
            }

            using (WebClient wc = new WebClient())
            {
                wc.Headers.Add("Content-Type", "application/json");
                string json = String.Format("{{\"username\": \"{0}\", \"password\": \"{1}\"}}", textBox1.Text, textBox2.Text);
                string response = wc.UploadString("http://162.212.157.37:42069/create", json);
                MessageBox.Show(response, "Union");
            }
        }

        private void panel1_MouseDown(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
                mousePos = e.Location;
        }

        private void panel1_MouseMove(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
                Location = new Point((Location.X - mousePos.X) + e.X, (Location.Y - mousePos.Y) + e.Y);
        }
    }
}
