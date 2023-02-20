using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;

using backend.Communication;
using System.Collections.Generic;
using System.IO;
using backend.Packages;
using System.Threading.Tasks;
using backend.Generated.CMToolbox;
using System.Net.Http;
using System.Linq;
using System;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PackageController : ControllerBase
    {
        ILogger<PackageController> _logger;
        ExhibitConnectionManager _connectionManager;
        PackagesClient _packagesClient;

        public PackageController(ILogger<PackageController> logger, ExhibitConnectionManager connectionManager)
        {
            this._logger = logger;
            this._connectionManager = connectionManager;

            string apiUrl = System.Environment.GetEnvironmentVariable("CMTOOLBOX_API_URL");
            if (!string.IsNullOrEmpty(apiUrl))
            {
                HttpClient httpClient = new HttpClient();
                this._packagesClient = new PackagesClient(apiUrl, httpClient);
            }
        }


        [HttpGet("available")]
        public async Task<IEnumerable<backend.ViewModels.PackageProperties>> GetAvailable()
        {
            if (this._packagesClient != null)
            {
                return (await this._packagesClient.GetPackagesAsync()).Select(p => new backend.ViewModels.PackageProperties {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Type = convertType(p.Type)
                });
            }
            else
            {
                // TODO: local storage
                return new backend.ViewModels.PackageProperties[] { };   
            }
        }

        private ViewModels.PackageType convertType(Generated.CMToolbox.PackageType type) => type switch
        {
            PackageType.Gallery => backend.ViewModels.PackageType.Gallery,
            PackageType.Model => backend.ViewModels.PackageType.Model,
            PackageType.Video => backend.ViewModels.PackageType.Video,
            PackageType.Scene => backend.ViewModels.PackageType.Scene,
            PackageType.Panorama => backend.ViewModels.PackageType.Panorama,
            _ => backend.ViewModels.PackageType.Scene
        };

        [HttpGet("download")]
        public async Task<IActionResult> Download(string packageName)
        {
            if (this._packagesClient != null)
            {
                return Redirect(this._packagesClient.BaseUrl + "/download/" + (await this._packagesClient.GetPackagesAsync()).First(p => p.Name == packageName).Id);
            }
            else
            {
                Stream stream = new FileStream(LocalPackageStorage.GetPackagePath(packageName), FileMode.Open);

                return File(stream, "application/octet-stream");
            }
        }

        [HttpPost("load")]
        public async Task<IActionResult> LoadPackage(string connectionId, string packageName)
        {
            await _connectionManager.LoadPackage(connectionId, packageName);

            return Ok();
        }

        [HttpPost("clear")]
        public async Task<IActionResult> ClearStartupPackage(string connectionId)
        {
            await _connectionManager.ClearStartupPackage(connectionId, true);

            return Ok();
        }
    }
}