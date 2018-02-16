using System;
using System.ComponentModel;
using System.Linq;
using System.Windows.Forms;
using WebSocketSharp;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace Union
{
    public partial class ClientManager : Component
    {
        public static WebSocket ws = new WebSocket("ws://127.0.0.1:443");
        public static Main client;
        private static Dictionary<int, List<Message>> messageCache = new Dictionary<int, List<Message>>();

        #region Functions

        public static void Connect(String name, String password)
        {
            ws.OnMessage += OnMessage;
            ws.OnClose += OnClose;
            ws.SetCredentials(name, password, true);
            ws.Connect();
        }

        public static List<Message> GetMessagesFor(int server)
        {
            List<Message> temp = new List<Message>();
            messageCache.TryGetValue(server, out temp);

            return temp;
        }

        public static void AddOrUpdate(int server, Message m)
        {
            if (messageCache.ContainsKey(server)) {
                messageCache[server].Add(m);
            }
            else
            {
                List<Message> messages = new List<Message>() { m };
                messageCache.Add(server, messages);
            }
        }

        public static void Purge()
        {
            messageCache.Clear();
        }

        static void Log(LogLevel level, Object content)
        {
            Console.WriteLine($"[{level.ToString()}] {content.ToString()}");
        }

        #endregion

        #region Events

        static void OnMessage(Object sender, MessageEventArgs e)
        {
            JObject data = JObject.Parse(e.Data);
            int op = (int)data.Property("op").Value;

            OPCODES code = (OPCODES)Enum.Parse(typeof(OPCODES), op.ToString());

            switch (code) {
                case OPCODES.Hello:
                    Form f = Application.OpenForms.OfType<Main>().First();
                    f.Invoke(new Action(() => f.Show()));
                    break;

                case OPCODES.DispatchServers:
                    JArray d = (JArray)data.Property("d").Value;
                    client.AddServers(d);
                    break;

                case OPCODES.DispatchMessage:
                    JObject messageData = (JObject)data.Property("d").Value;
                    JObject message = (JObject)messageData.Property("message").Value;

                    int server = (int)messageData.Property("server").Value;
                    string content = message.Property("content").Value.ToString();
                    string author = message.Property("author").Value.ToString();

                    Message m = new Message(author, content);
                    AddOrUpdate(server, m);

                    if (client.selectedServer == server)
                    {
                        client.messages.Invoke(new Action(() => client.messages.Controls.Add(m)));
                    }
                    break;
            }
           
        }

        static void OnClose(Object sender, CloseEventArgs e)
        {
            Log(LogLevel.INFO, $"Websocket closed with code {e.Code} and reason {e.Reason}");

            Form f = Application.OpenForms.OfType<Form1>().First();
            f.Invoke(new Action(() => f.Show()));

            ws.OnMessage -= OnMessage;
            ws.OnClose -= OnClose;
        }

        #endregion

        #region Enums

        enum LogLevel
        {
            DEBUG,
            INFO,
            ERROR
        }

        public enum OPCODES
        {
            Unused,
            Hello,
            DispatchJoin,
            DispatchMessage,
            DispatchServers,
            DispatchPresence,
            Message,
            JoinServer
        }

        #endregion
    }
}
