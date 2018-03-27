namespace Union
{
    class IMessage
    {
        public int server { get; set; }
        public string content { get; set; }

        public IMessage(int server, string content)
        {
            this.server = server;
            this.content = content;
        }
        
    }
}
