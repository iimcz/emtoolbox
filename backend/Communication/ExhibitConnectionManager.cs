using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using backend.Utils;

namespace backend.Communication
{
    public class ExhibitConnectionManager : IHostedService
    {
        // TODO: Configurable port
        private const int ServerListenPort = 3917;
        private ILogger<ExhibitConnectionManager> logger;

        private TcpListener incomingListener;
        private IAsyncResult incomingAsyncAccept;

        private Dictionary<string, ExhibitConnection> pendingConnections;
        private Dictionary<string, ExhibitConnection> establishedConnections;

        public ExhibitConnectionManager(ILogger<ExhibitConnectionManager> logger)
        {
            this.logger = logger;

            pendingConnections = new Dictionary<string, ExhibitConnection>();
            establishedConnections = new Dictionary<string, ExhibitConnection>();
        }

        public List<string> GetPendingConnections()
        {
            cleanupConnections();
            return new List<string>(pendingConnections.Keys);
        }

        public List<string> GetEstablishedConnections()
        {
            cleanupConnections();
            return new List<string>(establishedConnections.Keys);
        }

        public void AcceptPendingConnection(string connId)
        {
            ExhibitConnection conn;
            if (pendingConnections.TryGetValue(connId, out conn))
            {
                // TODO: thread safety
                conn.AcceptConnection();
                establishedConnections.Add(connId, conn);
                pendingConnections.Remove(connId);
            }
        }

        public void IncomingConnectionCallback(IAsyncResult ar)
        {
            cleanupConnections();
            // FIXME: possible race condition between IsBound and EndAcceptTcpClient
            if (incomingListener.Server.IsBound)
            {
                var client = incomingListener.EndAcceptTcpClient(ar);

                logger.LogInformation("Processing new incoming connection from {}", client.Client.RemoteEndPoint);
                var excon = new ExhibitConnection(client);
                if (excon.IsConnected)
                {
                    if (pendingConnections.ContainsKey(excon.ConnectionId))
                    {
                        logger.LogWarning("Received pending connection with duplicate ID ({}). Removing the old one.", excon.ConnectionId);
                        pendingConnections.Remove(excon.ConnectionId);
                    }
                    if (establishedConnections.ContainsKey(excon.ConnectionId))
                    {
                        logger.LogWarning("Received pending connection which is already connected ID: {}", excon.ConnectionId);
                    }
                    pendingConnections.Add(excon.ConnectionId, excon);

                    logger.LogInformation("Received connection ID: {}", excon.ConnectionId);
                }
                else
                {
                    logger.LogWarning("Received connection was invalid.");
                }

                incomingListener.BeginAcceptTcpClient(IncomingConnectionCallback, null);
            }
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            return Task.Run(() =>
            {
                incomingListener = new TcpListener(IPAddress.Any, ServerListenPort);
                incomingListener.Start();

                logger.LogInformation("Starting to listen for incoming TCP connections on port {}", ServerListenPort);
                incomingAsyncAccept = incomingListener.BeginAcceptTcpClient(IncomingConnectionCallback, null);
            });
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.Run(() =>
            {
                foreach (var conn in pendingConnections)
                {
                    conn.Value.Dispose();
                }

                foreach (var conn in establishedConnections)
                {
                    conn.Value.Dispose();
                }


                incomingListener.Stop();
            });
        }

        private void cleanupConnections()
        {
            Func<ExhibitConnection, bool> selector = (conn) => conn.IsConnected;
            establishedConnections.RemoveByValue(selector);
            pendingConnections.RemoveByValue(selector);
        }
    }
}