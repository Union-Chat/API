using System;
using System.ComponentModel;
using System.Linq;
using System.Windows.Forms;
using WebSocketSharp;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Text;
using System.Threading;

namespace Union
{
    public partial class ClientManager : Component
    {
        public static Form1 login;
        public static Main client;

        public static WebSocket ws = new WebSocket("ws://127.0.0.1:443");
        public static Form currentForm;
        private static Dictionary<int, List<Message>> messageCache = new Dictionary<int, List<Message>>();

        public static void CreateLogin(String errorMessage = "")
        {
            new Thread(() =>
            {
                login = new Form1();
                login.Show();
                login.ErrorReason.Text = errorMessage;
                Application.Run(login);
            }).Start();
        }

        public static void CreateClient()
        {
            new Thread(() =>
            {
                client = new Main();
                client.Show();
                Application.Run(client);
            }).Start();
        }

        #region Functions

        public static void Connect(String name, String password)
        {
            ws.OnMessage += OnMessage;
            ws.OnClose += OnClose;
            ws.SetCredentials(name, password, true);
            ws.ConnectAsync();
        }

        public static List<Message> GetMessagesFor(int server)
        {
            List<Message> temp = new List<Message>();
            messageCache.TryGetValue(server, out temp);

            return temp;
        }

        public static void GetMembersFor(int server)
        {
            IWSMessage wsm = new IWSMessage()
            {
                op = (int)OPCODES.SyncMembers,
                d = server
            };

            string compiled = JsonConvert.SerializeObject(wsm);
            ws.Send(Encoding.ASCII.GetBytes(compiled));
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

        public static void SendHeartbeat()
        {
            IWSMessage wsm = new IWSMessage()
            {
                op = (int)OPCODES.Heartbeat
            };

            string compiled = JsonConvert.SerializeObject(wsm);
            ws.Send(Encoding.ASCII.GetBytes(compiled));
        }

        public static void PurgeMessageCache()
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
                case OPCODES.Heartbeat:
                    SendHeartbeat();
                    break;
                case OPCODES.Hello:
                    CreateClient();
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
                        client.messages.Invoke(new Action(() => client.messages.Controls.Add(m)));
                    break;

                case OPCODES.DispatchPresence:
                    JObject presenceData = (JObject)data.Property("d").Value;
                    int userId = (int)presenceData.Property("user_id").Value;
                    bool online = (bool)presenceData.Property("status").Value;
                    //client.UpdatePresence(userId, online);
                    break;

                case OPCODES.DispatchMembers:
                    JArray members = (JArray)data.Property("d").Value;
                    client.AddMembers(members);
                    break;
            }
        }

        static void OnClose(Object sender, CloseEventArgs e)
        {
            Log(LogLevel.INFO, $"Websocket closed; code: {e.Code}, reason: {e.Reason}");

            ws.OnMessage -= OnMessage;
            ws.OnClose -= OnClose;

            CreateLogin(e.Reason);
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
            Heartbeat,
            Hello,
            DispatchJoin,
            DispatchMessage,
            DispatchServers,
            DispatchPresence,
            DispatchMembers,
            SyncMembers,
            Message,
            JoinServer
        }

        #endregion
    }
}
