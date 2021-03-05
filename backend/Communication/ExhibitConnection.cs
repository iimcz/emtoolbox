using System.Net.Sockets;
using System.Net;

using System;
using Google.Protobuf;
using Microsoft.Extensions.Logging;
using System.IO;

using Naki3D.Common.Protocol;

namespace backend.Communication
{
    public class ExhibitConnection : IDisposable
    {
        TcpClient connectionClient;


        public string ConnectionId { get; set; }

        public bool IsConnected { get { return connectionClient.Connected; } }

        public ExhibitConnection(TcpClient client)
        {
            connectionClient = client;

            RecvConnectionRequest();
        }

        private void RecvConnectionRequest()
        {
            try
            {
                var request = ConnectionRequest.Parser.ParseDelimitedFrom(connectionClient.GetStream());
                ConnectionId = request.ConnectionId;
            }
            catch (InvalidProtocolBufferException)
            {
                Dispose();
                return;
            }
            var ack = new ConnectionAcknowledgement();
            ack.Verified = false;

            ack.WriteDelimitedTo(connectionClient.GetStream());
        }

        public void Dispose()
        {
            connectionClient.Dispose();
        }

        public void AcceptConnection()
        {
            ConnectionAcknowledgement ack = new ConnectionAcknowledgement();
            ack.Verified = true;
            ack.SharedKey = ByteString.CopyFromUtf8("This is a shared key for exhibit-exhibit communication.");

            try
            {
                ack.WriteDelimitedTo(connectionClient.GetStream());
            }
            catch (Exception)
            {
                Dispose();
            }
        }
    }
}