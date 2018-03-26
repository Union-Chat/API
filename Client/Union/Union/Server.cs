using System.Drawing;
using System.Windows.Forms;

namespace Union
{
    class Server : Button
    {

        public string FullName { get; }
        public int Id { get; }
        public string Acronym { get; }

        public Server(string name, int id, int height)
        {
            FullName = name.Trim();
            Id = id;

            string acronym = "";
            foreach (string word in name.Trim().Split(new char[0]))
            {
                acronym += word[0];
            }

            Text = Acronym = acronym;

            Height = height;
            Dock = DockStyle.Top;
            BackColor = Color.FromArgb(50, 50, 50);
            ForeColor = Color.White;
            FlatStyle = FlatStyle.Flat;
            FlatAppearance.BorderSize = 0;

        }

    }
}
