using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using backend.Model;
using System.Linq;
using Naki3D.Common.Protocol;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Communication
{
    public class ExhibitConnectionManager : IHostedService
    {
        public event System.Action OnIncomingConnectionEvent;

        // TODO: Configurable port
        private const int ServerListenPort = 3917;
        private ILogger<ExhibitConnectionManager> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        private TcpListener _incomingListener;
        private IAsyncResult _incomingAsyncAccept;

        private ConcurrentDictionary<string, ExhibitConnection> _pendingConnections;
        private ConcurrentDictionary<string, ExhibitConnection> _establishedConnections;

        public ExhibitConnectionManager(ILogger<ExhibitConnectionManager> logger, IServiceScopeFactory scopeFactory)
        {
            this._logger = logger;
            this._scopeFactory = scopeFactory;

            _pendingConnections = new ConcurrentDictionary<string, ExhibitConnection>();
            _establishedConnections = new ConcurrentDictionary<string, ExhibitConnection>();
        }

        public List<string> GetPendingConnections()
        {
            cleanupConnections();
            return new List<string>(_pendingConnections.Keys);
        }

        public List<string> GetEstablishedConnections()
        {
            cleanupConnections();
            return new List<string>(_establishedConnections.Keys);
        }

        public void AcceptPendingConnection(string connId)
        {
            ExhibitConnection conn;
            if (_pendingConnections.TryGetValue(connId, out conn))
            {
                // TODO: thread safety
                conn.AcceptConnection();
                _establishedConnections.TryAdd(connId, conn);
                _pendingConnections.TryRemove(connId, out _);
            }
        }

        public void CloseConnection(string connId)
        {
            ExhibitConnection conn;
            if (_pendingConnections.TryRemove(connId, out conn))
            {
                conn.Dispose();
            }
        }

        public void ClearPackage(string connId)
        {
            ExhibitConnection conn;
            if (_establishedConnections.TryGetValue(connId, out conn))
            {
                // TODO: for now always purge.
                conn.ClearPackage(true);
            }
        }

        public void LoadPackage(string connId, string packageDescriptor)
        {
            ExhibitConnection conn;
            if (_establishedConnections.TryGetValue(connId, out conn))
            {
                conn.LoadPackage(false, packageDescriptor);
            }
        }

        public void IncomingConnectionCallback(IAsyncResult ar)
        {
            cleanupConnections();
            // FIXME: possible race condition between IsBound and EndAcceptTcpClient
            if (_incomingListener.Server.IsBound)
            {
                var client = _incomingListener.EndAcceptTcpClient(ar);

                _logger.LogInformation("Processing new incoming connection from {}", client.Client.RemoteEndPoint);
                var excon = new ExhibitConnection(client);
                subscribeToEvents(excon);
                excon.ReceiveConnectionRequest();

                if (excon.IsConnected)
                {
                    if (_pendingConnections.ContainsKey(excon.ConnectionId))
                    {
                        _logger.LogWarning("Received pending connection with duplicate ID ({}). Removing the old one.", excon.ConnectionId);
                        _pendingConnections.TryRemove(excon.ConnectionId, out _);
                    }
                    if (_establishedConnections.ContainsKey(excon.ConnectionId))
                    {
                        _logger.LogWarning("Received pending connection which is already connected ID: {}", excon.ConnectionId);
                    }
                    _pendingConnections.TryAdd(excon.ConnectionId, excon);

                    OnIncomingConnectionEvent?.Invoke();

                    _logger.LogInformation("Received connection ID: {}", excon.ConnectionId);
                }
                else
                {
                    _logger.LogWarning("Received connection was invalid.");
                }

                if (isKnownExhibit(excon.ConnectionId))
                {
                    _logger.LogInformation("Auto-accepting known exhibit: {}", excon.ConnectionId);
                    AcceptPendingConnection(excon.ConnectionId);
                }

                _incomingListener.BeginAcceptTcpClient(IncomingConnectionCallback, null);
            }
        }

        private bool isKnownExhibit(string connectionId)
        {
            using (var scope = this._scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<EmtContext>();
                return dbContext.Exhibits.Any(exhibit => exhibit.Hostname == connectionId);
            }
        }

        private void subscribeToEvents(ExhibitConnection excon)
        {
            excon.DescriptorChanged += (object obj, DeviceDescriptor e) =>
            {
                ExhibitConnection sender = (ExhibitConnection)obj;
                sender.SendEncryptionInfo();

                // using (var scope = this._scopeFactory.CreateScope())
                // {
                //     var dbContext = scope.ServiceProvider.GetRequiredService<EmtContext>();
                //     Exhibit exhibit = dbContext.Exhibits.Include(exhibit => exhibit.Sensors).FirstOrDefault(exhibit => exhibit.Hostname == sender.ConnectionId);
                //     if (exhibit != null)
                //     {
                //         // TODO: update protocol to include more info about sensors
                //         Func<SensorType, int, Sensor> mapping = (SensorType type, int i) =>
                //         {
                //             return new Sensor
                //             {
                //                 Path = Enum.GetName(type) + i.ToString(),
                //                 FriendlyName = Enum.GetName(type) + " " + obj.ToString(),
                //                 ValueType = type switch
                //                 {
                //                     SensorType.Gesture => Model.ValueType.Complex,
                //                     SensorType.Handtracking => Model.ValueType.Complex,
                //                     SensorType.Image => Model.ValueType.Complex,
                //                     SensorType.Depth => Model.ValueType.Number,
                //                     SensorType.Ir => Model.ValueType.Bool,
                //                     SensorType.Light => Model.ValueType.Number,
                //                     SensorType.Microphone => Model.ValueType.Number,
                //                     _ => Model.ValueType.Void
                //                 }
                //             };
                //         };

                //         for (int i = 0; i < e.LocalSensors.Count; i++)
                //         {
                //             Sensor s = mapping(e.LocalSensors[i], i);
                //             if (exhibit.Sensors[i].Path != s.Path)
                //             {
                //                 exhibit.Sensors[i] = s;
                //             }
                //         }
                //         dbContext.SaveChanges();
                //     }
                // }
            };

            excon.ExhibitTimedOut += (object obj, EventArgs e) =>
            {
                ExhibitConnection sender = (ExhibitConnection)obj;
                ExhibitConnection _dummy;
                _establishedConnections.TryRemove(sender.ConnectionId, out _dummy);
                _pendingConnections.TryRemove(sender.ConnectionId, out _dummy);

                _logger.LogWarning("Exhibit (ID: {0}) timed out.", sender.ConnectionId);
            };
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            return Task.Run(() =>
            {
                _incomingListener = new TcpListener(IPAddress.IPv6Any, ServerListenPort);
                _incomingListener.Server.SetSocketOption(SocketOptionLevel.IPv6, SocketOptionName.IPv6Only, false);
                _incomingListener.Start();

                _logger.LogInformation("Starting to listen for incoming TCP connections on port {}", ServerListenPort);
                _incomingAsyncAccept = _incomingListener.BeginAcceptTcpClient(IncomingConnectionCallback, null);
            });
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.Run(() =>
            {
                foreach (var conn in _pendingConnections)
                {
                    conn.Value.Dispose();
                }

                foreach (var conn in _establishedConnections)
                {
                    conn.Value.Dispose();
                }


                _incomingListener.Stop();
            });
        }

        public string GetInterfaceAddressFor(string connId)
        {
            _establishedConnections.TryGetValue(connId, out var connection);

            if (connection != null)
            {
                return connection.GetSocketAddress();
            }
            else
            {
                return null;
            }
        }

        private void cleanupConnections()
        {
            // TODO: implement this properly - this code doesn't work correctly (breaks the dictionary)
            // Func<ExhibitConnection, bool> selector = (conn) => conn.IsConnected;
            // establishedConnections.RemoveByValue(selector);
            // pendingConnections.RemoveByValue(selector);
        }
    }
}