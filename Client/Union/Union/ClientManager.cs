using System;
using System.ComponentModel;
using System.Windows.Forms;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Threading;
using System.IO;
using System.Threading.Tasks;
using WebSocket4Net;
using System.Text;

namespace Union
{
    public partial class ClientManager : Component
    {
        public static Form1 login;
        public static Main client;

        private static TextWriter LogFile = File.AppendText("union-log.txt");
        public static WebSocket ws;
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
            string b64Encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{name}:{password}"));
            List<KeyValuePair<string, string>> headers = new List<KeyValuePair<string, string>>
            {
                new KeyValuePair<string, string>("authorization", $"Basic {b64Encoded}")
            };

            ws = new WebSocket("ws://union.serux.pro:2082", customHeaderItems: headers);
            ws.Closed += OnClose;
            ws.Error += OnError;
            ws.MessageReceived += OnMessage;
            ws.Open();
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
            ws.Send(compiled);
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
            ws.Send(compiled);
        }

        public static void PurgeMessageCache()
        {
            messageCache.Clear();
        }

        static void Log(LogLevel level, Object content, params Object[] extra)
        {
            String log = content.ToString() + "\n\t";
            foreach (Object o in extra)
            {
                log += o.ToString() + "\n\t";
            }
            Console.WriteLine($"[{level.ToString()}] {log.Trim()}");
            LogFile.WriteLine($"[{level.ToString()}] {log.Trim()}");
        }

        public static void WriteLog()
        {
            LogFile.Flush();
            LogFile.Close();
        }

        #endregion

        #region Events

        async static void OnMessage(Object sender,  EventArgs eventArgs)
        {
            MessageReceivedEventArgs e = (MessageReceivedEventArgs)eventArgs;
            Log(LogLevel.DEBUG, e.Message);
            try
            {
                JObject data = JObject.Parse(e.Message);
                int op = (int)data.Property("op").Value;

                OPCODES code = (OPCODES)Enum.Parse(typeof(OPCODES), op.ToString());
                Log(LogLevel.DEBUG, $"Received message with opcode {op} ({code})");
                Log(LogLevel.DEBUG, e.Message);

                switch (code)
                {
                    case OPCODES.Heartbeat:
                        SendHeartbeat();
                        break;

                    case OPCODES.Hello:
                        CreateClient();
                        JArray d = (JArray)data.Property("d").Value;

                        await Task.Delay(500); // Fuck off raceconditions
                        client.AddServers(d);
                        break;

                    case OPCODES.DispatchMessage:
                        JObject message = (JObject)data.Property("d").Value;

                        int server = (int)message.Property("server").Value;
                        string content = message.Property("content").Value.ToString();
                        string author = message.Property("author").Value.ToString();

                        Message m = new Message(author, content);
                        AddOrUpdate(server, m);

                        if (client.selectedServer == server)
                            client.messages.Invoke(new Action(() => client.messages.Controls.Add(m)));
                        break;

                    case OPCODES.DispatchPresence:
                        JObject presenceData = (JObject)data.Property("d").Value;
                        string userId = presenceData.Property("id").Value.ToString();
                        bool online = (bool)presenceData.Property("status").Value;

                        await Task.Delay(500); // Fuck off raceconditions
                        client.UpdatePresence(userId, online);
                        break;

                    case OPCODES.DispatchMembers:
                        JArray members = (JArray)data.Property("d").Value;
                        client.AddMembers(members);
                        break;
                }
            }
            catch (Exception err)
            {
                Log(LogLevel.ERROR, err.ToString());
            }
        }

        static void OnError(Object sender, SuperSocket.ClientEngine.ErrorEventArgs e)
        {
            Log(LogLevel.ERROR, $"Websocket encountered an exception", e.Exception);
        }

        static void OnClose(Object sender, EventArgs eventArgs)
        {
            ClosedEventArgs e = (ClosedEventArgs)eventArgs;
            
            Log(LogLevel.INFO, $"Websocket closed - code: {e.Code}, reason: {e.Reason}");
            ws.MessageReceived -= OnMessage;
            ws.Closed -= OnClose;
            ws.Error -= OnError;

            if (client != null)
            {
                client.Invoke(new Action(() => client.Dispose()));
            }

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
            DispatchPresence,
            DispatchMembers,
            SyncMembers,
            Message,
            JoinServer
        }

        #endregion
    }
}
