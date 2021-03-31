using System.Net.Sockets;
using System.Net;
using System.Threading.Tasks;
using System.Timers;

using System;
using Google.Protobuf;
using System.IO;

using Naki3D.Common.Protocol;
using System.Text;
using backend.Extensions;

namespace backend.Communication
{
    public class ExhibitConnection : IDisposable
    {
        private readonly double TIMEOUT_INTERVAL = 30_000;

        TcpClient connectionClient;
        Stream connectionStream;
        JsonObjectStringReader jsonReader;
        Timer timeoutTimer;
        Task receiveLoopTask;
        bool accepted = false;

        DeviceDescriptor descriptor = null;

        public string ConnectionId { get; private set; }
        public string PublicKey { get; private set; }


        public bool IsConnected { get { return connectionClient.Connected; } }

        // Events
        public event EventHandler ExhibitTimedOut;
        public event EventHandler DescriptorChanged;

        public ExhibitConnection(TcpClient client)
        {
            connectionClient = client;
            connectionStream = client.GetStream();
            jsonReader = new JsonObjectStringReader(connectionStream);
            timeoutTimer = new Timer(TIMEOUT_INTERVAL);
            timeoutTimer.Elapsed += (object sender, ElapsedEventArgs e) => {
                ExhibitTimedOut?.Invoke(this, new EventArgs());
                Dispose();
            };
        }

        private void ResetTimeout()
        {
            timeoutTimer.Interval = TIMEOUT_INTERVAL;
        }

        private void MessageReceiveLoop()
        {
            while (true)
            {
                DeviceMessage message = null;
                try 
                {
                    message = DeviceMessage.Parser.ParseJson(jsonReader.NextJsonObject());
                }
                catch (InvalidProtocolBufferException)
                {
                    Console.WriteLine("InvalidProtobuf");
                    // TODO: proper loging
                    // Failed either due to message having invalid format
                    // If the stream is still open, it will eventually time out.
                    return;
                }
                catch (InvalidDataException)
                {
                    Console.WriteLine("InvalidData");
                    // TODO: proper loging
                    // Failed either due to the stream closing or because of another error.
                    // If the stream is still open, it will eventually time out.
                    return;
                }
                
                switch (message.MessageCase)
                {
                    case DeviceMessage.MessageOneofCase.DeviceDescriptor:
                        ResetTimeout();
                        if (!accepted)
                            continue; // Ignore if coming from an unaccepted client
                        descriptor = message.DeviceDescriptor;
                        DescriptorChanged?.Invoke(this, new EventArgs());
                        break;
                    case DeviceMessage.MessageOneofCase.Ping:
                        ResetTimeout();
                        break;
                }
            }
        }

        public void ReceiveConnectionRequest()
        {
            try
            {
                var request = ConnectionRequest.Parser.ParseJson(jsonReader.NextJsonObject());
                ConnectionId = request.ConnectionId;
                PublicKey = request.PublicKey.ToStringUtf8();
            }
            catch (InvalidProtocolBufferException)
            {
                // TODO: logging
                Dispose();
                return;
            }
            catch (InvalidDataException)
            {
                // TODO: logging
                Dispose();
                return;
            }

            var ack = new ConnectionAcknowledgement();
            ack.Verified = false;
            ack.WriteJsonTo(connectionStream);

            timeoutTimer.Start();

            receiveLoopTask = Task.Run(MessageReceiveLoop);
        }

        public void Dispose()
        {
            connectionClient.Dispose();
            if (receiveLoopTask != null && !receiveLoopTask.IsCompleted)
                receiveLoopTask.RunSynchronously();
        }

        public void AcceptConnection()
        {
            ConnectionAcknowledgement ack = new ConnectionAcknowledgement();
            ack.ConnectionId = ConnectionId;
            ack.Verified = true;

            try
            {
                ack.WriteJsonTo(connectionStream);
            }
            catch (Exception)
            {
                Dispose();
                throw;
            }

            accepted = true;
        }
    }
}