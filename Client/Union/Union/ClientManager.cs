using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketSharp;

namespace Union
{
    public partial class ClientManager : Component
    {
        public static WebSocket ws = new WebSocket("ws://127.0.0.1:443");

        public static void Connect(String name, String password)
        {
            ws.OnMessage += OnMessage;
            ws.OnClose += OnClose;
            ws.SetCredentials(name, password, true);
            ws.ConnectAsync();
        }

        static void OnMessage(Object sender, MessageEventArgs e)
        {
            Log(LogLevel.DEBUG, e.Data);
        }

        static void OnClose(Object sender, EventArgs e)
        {
            Form1 login = new Form1();
            login.Show();

            ws.OnMessage -= OnMessage;
            ws.OnClose -= OnClose;
        }

        static void Log(LogLevel level, String content)
        {
            Console.WriteLine($"[{level.ToString()}] {content}");
        }

        enum LogLevel
        {
            DEBUG,
            INFO,
            ERROR
        }
    }
}
