using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;

using backend.Communication;
using System.Collections.Generic;
using System.IO;
using backend.Packages;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PackageController : ControllerBase
    {
        ILogger<ConnectionController> logger;
        ExhibitConnectionManager connectionManager;

        public PackageController(ILogger<ConnectionController> logger, ExhibitConnectionManager connectionManager)
        {
            this.logger = logger;
            this.connectionManager = connectionManager;
        }


        [HttpGet("available")]
        public IEnumerable<string> GetAvailable()
        {
            return LocalPackageStorage.ListPackages();
        }

        [HttpGet("download")]
        public IActionResult Download(string packageName)
        {
            Stream stream = new FileStream(LocalPackageStorage.GetPackagePath(packageName), FileMode.Open);

            return File(stream, "application/octet-stream");
        }

        [HttpPost("load")]
        public IActionResult LoadPackage(string connectionId, string packageName)
        {
            connectionManager.LoadPackage(connectionId, packageName);

            return Ok();
        }

        [HttpPost("clear")]
        public IActionResult ClearPackage(string connectionId)
        {
            connectionManager.ClearPackage(connectionId);

            return Ok();
        }
    }
}