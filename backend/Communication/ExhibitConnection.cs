using System.Net.Sockets;
using System.Net;
using System.Threading.Tasks;
using System.Timers;

using System;
using Google.Protobuf;
using Microsoft.Extensions.Logging;
using System.IO;

using Naki3D.Common.Protocol;

namespace backend.Communication
{
    public class ExhibitConnection : IDisposable
    {
        private readonly double TIMEOUT_INTERVAL = 30_000;

        TcpClient connectionClient;
        Stream connectionStream;
        Timer timeoutTimer;
        Task receiveLoopTask;
        bool accepted = false;

        public string ConnectionId { get; set; }

        public bool IsConnected { get { return connectionClient.Connected; } }

        // Events
        public event EventHandler ExhibitTimedOut;

        public ExhibitConnection(TcpClient client)
        {
            connectionClient = client;
            connectionStream = client.GetStream();
            timeoutTimer = new Timer(TIMEOUT_INTERVAL);
            timeoutTimer.Elapsed += (object sender, ElapsedEventArgs e) => {
                ExhibitTimedOut?.Invoke(this, null);
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
                    message = DeviceMessage.Parser.ParseDelimitedFrom(connectionStream);
                }
                catch (InvalidProtocolBufferException)
                {
                    // TODO: log
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
                        // TODO: save/use descriptor
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
                var request = ConnectionRequest.Parser.ParseDelimitedFrom(connectionStream);
                ConnectionId = request.ConnectionId;
            }
            catch (InvalidProtocolBufferException)
            {
                Dispose();
                throw;
            }

            var ack = new ConnectionAcknowledgement();
            ack.Verified = false;
            ack.WriteDelimitedTo(connectionStream);

            timeoutTimer.Start();

            receiveLoopTask = Task.Run(MessageReceiveLoop);
        }

        public void Dispose()
        {
            connectionClient.Dispose();
            if (!receiveLoopTask.IsCompleted)
                receiveLoopTask.RunSynchronously();
        }

        public void AcceptConnection()
        {
            ConnectionAcknowledgement ack = new ConnectionAcknowledgement();
            ack.ConnectionId = ConnectionId;
            ack.Verified = true;

            try
            {
                ack.WriteDelimitedTo(connectionClient.GetStream());
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