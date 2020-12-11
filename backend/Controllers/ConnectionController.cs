using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;

using backend.Communication;
using System.Collections.Generic;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ConnectionController : ControllerBase
    {
        ILogger<ConnectionController> logger;
        ExhibitConnectionManager connectionManager;

        public ConnectionController(ILogger<ConnectionController> logger, ExhibitConnectionManager connectionManager)
        {
            this.logger = logger;
            this.connectionManager = connectionManager;
        }

        [HttpGet("pending")]
        public IEnumerable<string> GetPending()
        {
            return connectionManager.GetPendingConnections();
        }

        [HttpGet("connected")]
        public IEnumerable<string> GetConnected()
        {
            return connectionManager.GetEstablishedConnections();
        }

        [HttpPost("accept")]
        public IActionResult AcceptPending(string id)
        {
            connectionManager.AcceptPendingConnection(id);
            return Ok();
        }
    }
}