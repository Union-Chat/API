namespace Union
{
    partial class Message
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.Content = new System.Windows.Forms.Label();
            this.Username = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // Content
            // 
            this.Content.Dock = System.Windows.Forms.DockStyle.Fill;
            this.Content.Font = new System.Drawing.Font("Verdana", 9F);
            this.Content.ForeColor = System.Drawing.Color.White;
            this.Content.Location = new System.Drawing.Point(0, 25);
            this.Content.Name = "Content";
            this.Content.Padding = new System.Windows.Forms.Padding(5, 0, 0, 0);
            this.Content.Size = new System.Drawing.Size(315, 68);
            this.Content.TabIndex = 0;
            this.Content.Text = "Content";
            this.Content.UseCompatibleTextRendering = true;
            // 
            // Username
            // 
            this.Username.Dock = System.Windows.Forms.DockStyle.Top;
            this.Username.Font = new System.Drawing.Font("Open Sans", 10F);
            this.Username.ForeColor = System.Drawing.Color.White;
            this.Username.Location = new System.Drawing.Point(0, 0);
            this.Username.Name = "Username";
            this.Username.Padding = new System.Windows.Forms.Padding(3, 3, 0, 0);
            this.Username.Size = new System.Drawing.Size(315, 25);
            this.Username.TabIndex = 1;
            this.Username.Text = "Username";
            this.Username.Paint += new System.Windows.Forms.PaintEventHandler(this.Username_Paint);
            // 
            // Message
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(60)))), ((int)(((byte)(60)))), ((int)(((byte)(60)))));
            this.Controls.Add(this.Content);
            this.Controls.Add(this.Username);
            this.DoubleBuffered = true;
            this.Name = "Message";
            this.Size = new System.Drawing.Size(315, 93);
            this.ResumeLayout(false);

        }

        #endregion

        public System.Windows.Forms.Label Content;
        public System.Windows.Forms.Label Username;
    }
}
