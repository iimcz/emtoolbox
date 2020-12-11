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
        CodedInputStream inputStream;
        CodedOutputStream outputStream;


        public string ConnectionId { get; set; }

        public bool IsConnected { get { return connectionClient.Connected; } }

        public ExhibitConnection(TcpClient client)
        {
            connectionClient = client;

            inputStream = new CodedInputStream(client.GetStream(), true);
            outputStream = new CodedOutputStream(client.GetStream(), true);

            RecvConnectionRequest();
        }

        private void RecvConnectionRequest()
        {
            try
            {
                var request = ConnectionRequest.Parser.ParseFrom(inputStream);
                ConnectionId = request.ConnectionId;
            }
            catch (InvalidProtocolBufferException)
            {
                Dispose();
                return;
            }
            var ack = new ConnectionAcknowledgement();
            ack.Verified = false;

            ack.WriteTo(outputStream);
        }

        public void Dispose()
        {
            try
            {
                inputStream.Dispose();
            }
            catch (IOException) { }

            try
            {
                outputStream.Dispose();
            }
            catch (IOException) { }

            connectionClient.Dispose();
        }

        public void AcceptConnection()
        {
            ConnectionAcknowledgement ack = new ConnectionAcknowledgement();
            ack.Verified = true;
            ack.SharedKey = ByteString.CopyFromUtf8("This is a shared key for exhibit-exhibit communication.");

            try
            {
                ack.WriteTo(outputStream);
            }
            catch (Exception)
            {
                Dispose();
            }
        }
    }
}