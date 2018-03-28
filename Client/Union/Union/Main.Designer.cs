namespace Union
{
    partial class Main
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

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.panel1 = new System.Windows.Forms.Panel();
            this.Members = new System.Windows.Forms.Panel();
            this.textBox1 = new WatermarkTextbox.WatermarkTextbox();
            this.messages = new Union.ExPanel();
            this.SuspendLayout();
            // 
            // panel1
            // 
            this.panel1.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(50)))), ((int)(((byte)(50)))), ((int)(((byte)(50)))));
            this.panel1.Dock = System.Windows.Forms.DockStyle.Left;
            this.panel1.Location = new System.Drawing.Point(0, 0);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(60, 518);
            this.panel1.TabIndex = 0;
            // 
            // Members
            // 
            this.Members.AutoScroll = true;
            this.Members.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(50)))), ((int)(((byte)(50)))), ((int)(((byte)(50)))));
            this.Members.Dock = System.Windows.Forms.DockStyle.Right;
            this.Members.Location = new System.Drawing.Point(578, 0);
            this.Members.Name = "Members";
            this.Members.Size = new System.Drawing.Size(204, 518);
            this.Members.TabIndex = 3;
            // 
            // textBox1
            // 
            this.textBox1.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(70)))), ((int)(((byte)(70)))), ((int)(((byte)(70)))));
            this.textBox1.BorderStyle = System.Windows.Forms.BorderStyle.None;
            this.textBox1.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.textBox1.Enabled = false;
            this.textBox1.Font = new System.Drawing.Font("Arial", 9.75F);
            this.textBox1.ForeColor = System.Drawing.Color.White;
            this.textBox1.Location = new System.Drawing.Point(60, 493);
            this.textBox1.Margin = new System.Windows.Forms.Padding(5);
            this.textBox1.MaximumSize = new System.Drawing.Size(0, 100);
            this.textBox1.MinimumSize = new System.Drawing.Size(0, 25);
            this.textBox1.Multiline = true;
            this.textBox1.Name = "textBox1";
            this.textBox1.Size = new System.Drawing.Size(518, 25);
            this.textBox1.TabIndex = 4;
            this.textBox1.WatermarkCentered = false;
            this.textBox1.WatermarkColour = System.Drawing.Color.LightGray;
            this.textBox1.WatermarkItalics = true;
            this.textBox1.WatermarkText = "Send a message...";
            this.textBox1.TextChanged += new System.EventHandler(this.textBox1_TextChanged);
            this.textBox1.Enter += new System.EventHandler(this.textBox1_Enter);
            this.textBox1.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.textBox1_KeyPress);
            this.textBox1.Leave += new System.EventHandler(this.textBox1_Leave);
            // 
            // messages
            // 
            this.messages.AutoScroll = true;
            this.messages.AutoScrollMinSize = new System.Drawing.Size(10, 10);
            this.messages.Dock = System.Windows.Forms.DockStyle.Fill;
            this.messages.Location = new System.Drawing.Point(60, 0);
            this.messages.Name = "messages";
            this.messages.Size = new System.Drawing.Size(518, 493);
            this.messages.TabIndex = 5;
            this.messages.ControlRemoved += new System.Windows.Forms.ControlEventHandler(this.messages_ControlRemoved);
            // 
            // Main
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(60)))), ((int)(((byte)(60)))), ((int)(((byte)(60)))));
            this.ClientSize = new System.Drawing.Size(782, 518);
            this.Controls.Add(this.messages);
            this.Controls.Add(this.textBox1);
            this.Controls.Add(this.Members);
            this.Controls.Add(this.panel1);
            this.DoubleBuffered = true;
            this.Name = "Main";
            this.ShowIcon = false;
            this.Text = "Union";
            this.FormClosing += new System.Windows.Forms.FormClosingEventHandler(this.Main_FormClosing);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Panel panel1;
        public System.Windows.Forms.Panel Members;
        private WatermarkTextbox.WatermarkTextbox textBox1;
        public ExPanel messages;
    }
}