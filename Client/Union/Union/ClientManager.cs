using System;
using System.ComponentModel;
using System.Linq;
using System.Windows.Forms;
using WebSocketSharp;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Union
{
    public partial class ClientManager : Component
    {
        public static WebSocket ws = new WebSocket("ws://127.0.0.1:443");
        public static Main client;

        public static void Connect(String name, String password)
        {
            ws.OnMessage += OnMessage;
            ws.OnClose += OnClose;
            ws.SetCredentials(name, password, true);
            ws.Connect();
        }

        static void OnMessage(Object sender, MessageEventArgs e)
        {
            JObject data = JObject.Parse(e.Data);
            int op = (int)data.Property("op").Value;

            Log(LogLevel.DEBUG, op);

            OPCODES code = (OPCODES)Enum.Parse(typeof(OPCODES), op.ToString());

            switch (code) {
                case OPCODES.Hello:
                    Log(LogLevel.DEBUG, "Received hello!");
                    Form f = Application.OpenForms.OfType<Main>().First();
                    f.Invoke(new Action(() => f.Show()));
                    break;
                case OPCODES.DispatchServers:
                    JArray d = (JArray)data.Property("d").Value;
                    client.AddServers(d);
                    break;
            }
           
            Log(LogLevel.DEBUG, e.Data);
        }

        static void OnClose(Object sender, CloseEventArgs e)
        {

            Log(LogLevel.INFO, $"Websocket closed with code {e.Code} and reason {e.Reason}");

            Form f = Application.OpenForms.OfType<Form1>().First();
            f.Invoke(new Action(() => f.Show()));

            ws.OnMessage -= OnMessage;
            ws.OnClose -= OnClose;

            MessageBox.Show(text:$"With code: {e.Code}\nWith reason: {e.Reason}", caption:"WebSocket Closed");
        }

        static void Log(LogLevel level, Object content)
        {
            Console.WriteLine($"[{level.ToString()}] {content.ToString()}");
        }

        enum LogLevel
        {
            DEBUG,
            INFO,
            ERROR
        }

        enum OPCODES
        {
            Unused,
            Hello,
            DispatchJoin,
            DispatchMessage,
            DispatchServers,
            Message,
            JoinServer
        }

     }
}
