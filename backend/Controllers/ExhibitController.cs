using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using backend.Communication;
using backend.Generated.CMToolbox;
using backend.Middleware;
using backend.Model;
using backend.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Naki3D.Common.Json;

using N3DAction = Naki3D.Common.Json.Action;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ExhibitController : ControllerBase
    {
        // TODO: proper schema location
        private static readonly string PACKAGE_DESCRIPTOR_SCHEMA = "https://www.iim.cz/package-schema.json";

        private ILogger<ExhibitController> _logger;
        private ExhibitConnectionManager _connectionManager;
        private EmtContext _dbContext;
        private PackagesClient _packagesClient;
        private string _cmtoolboxDownloadUrlBase;

        public ExhibitController(ILogger<ExhibitController> logger, ExhibitConnectionManager connectionManager, EmtContext dbContext)
        {
            _logger = logger;
            _connectionManager = connectionManager;
            _dbContext = dbContext;

            string apiUrl = System.Environment.GetEnvironmentVariable("CMTOOLBOX_API_URL");
            if (!string.IsNullOrEmpty(apiUrl))
            {
                HttpClient httpClient = new HttpClient();
                this._packagesClient = new PackagesClient(apiUrl, httpClient);
            }
            _cmtoolboxDownloadUrlBase = System.Environment.GetEnvironmentVariable("CMTOOLBOX_API_DOWNLOAD_BASEURL");
        }

        [HttpGet("pending")]
        [ResponseCache(NoStore = true)]
        public IEnumerable<string> GetPendingConnections() =>
            _connectionManager.GetPendingConnections();

        [HttpGet("established")]
        [ResponseCache(NoStore = true)]
        public IEnumerable<string> GetEstablishedConnections() =>
            _connectionManager.GetEstablishedConnections();

        [HttpPost("accept/{id}")]
        public async Task<ActionResult> AcceptConnection(string id)
        {
            _connectionManager.AcceptPendingConnection(id);
            await _dbContext.Exhibits.AddAsync(new Exhibit
            {
                Hostname = id
            });
            await _dbContext.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("forget/{id}")]
        public async Task<ActionResult> ForgetConnection(string id)
        {
            _connectionManager.CloseConnection(id);
            Exhibit exhibit = await _dbContext.Exhibits.FirstOrDefaultAsync(ex => ex.Hostname == id);
            if (exhibit != null)
            {
                _dbContext.Exhibits.Remove(exhibit);
                await _dbContext.SaveChangesAsync();
            }
            return Ok();
        }

        [HttpGet("all")]
        public List<ExhibitProperties> GetAllExhibits()
        {
            List<ExhibitProperties> exhibits = _dbContext.Exhibits.Include(ex => ex.Sensors).Include(ex => ex.Tags).Select(ex => new ExhibitProperties
            {
                Hostname = ex.Hostname,
                Sensors = ex.Sensors.Select(s => new SensorProperties
                {
                    Path = s.Path,
                    FriendlyName = s.FriendlyName,
                    ValueType = s.ValueType,
                    AvailableEvents = s.AvailableEvents
                }).ToList(),
                Tags = ex.Tags.Select(t => t.Tag).ToList()
            }).ToList();

            return exhibits;
        }

        [HttpGet("details/{exhibit_id}")]
        public async Task<ActionResult<ExhibitProperties>> GetExhibit(string exhibit_id)
        {
            Exhibit exhibit = await _dbContext.Exhibits.Include(ex => ex.Sensors).Include(ex => ex.Tags).FirstOrDefaultAsync(ex => ex.Hostname == exhibit_id);
            if (exhibit == null)
                return NotFound();

            return Ok(new ExhibitProperties()
            {
                Hostname = exhibit.Hostname,
                Sensors = exhibit.Sensors.Select(s => new SensorProperties
                {
                    Path = s.Path,
                    FriendlyName = s.FriendlyName,
                    ValueType = s.ValueType,
                    AvailableEvents = s.AvailableEvents
                }).ToList(),
                Tags = exhibit.Tags.Select(t => t.Tag).ToList()
            });
        }

        [HttpPost("send/{exposition_id}")]
        public async Task<ActionResult> SendPackages(int exposition_id)
        {
            Exposition exposition = await _dbContext.Expositions
                .Include(ex => ex.PackageOverlays)
                .ThenInclude(ov => ov.AssignedExhibit)
                .FirstOrDefaultAsync(ex => ex.Id == exposition_id);
            if (exposition == null)
                return NotFound();
            
            foreach (var overlay in exposition.PackageOverlays)
            {
                _logger.LogWarning("Pkg ID: {0}", overlay.PackageId);
                PresentationPackage package = await _packagesClient.GetPackageAsync(overlay.PackageId);

                _connectionManager.ClearPackage(overlay.AssignedExhibit.Hostname);

                using (var writer = new StringWriter())
                {
                    await WritePackageJsonAsync(package, overlay, writer);
                    // TODO: remove debug
                    await System.IO.File.WriteAllTextAsync("/home/maxik/test.json", writer.ToString());
                    _connectionManager.LoadPackage(overlay.AssignedExhibit.Hostname, writer.ToString());
                }
            }

            return Ok();
        }

        [NonAction]
        public async Task WritePackageJsonAsync(PresentationPackage package, PackageOverlay overlay, TextWriter writer)
        {
            PackageDescriptor packageDescriptor = new PackageDescriptor();
            packageDescriptor.Schema = PACKAGE_DESCRIPTOR_SCHEMA;
            packageDescriptor.Version = "N/A"; // TODO: version?

            packageDescriptor.Inputs = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Naki3D.Common.Json.Action>>(package.InputsJson, Naki3D.Common.Json.Converter.Settings);
            packageDescriptor.Parameters = Newtonsoft.Json.JsonConvert.DeserializeObject<Naki3D.Common.Json.Parameters>(package.ParametersJson, Naki3D.Common.Json.Converter.Settings);
            packageDescriptor.Metadata = new Metadata
            {
                PackageName = package.Name,
                Description = package.Description,
                Author = package.Metadata.SingleOrDefault(m => m.Key == "author")?.Value,
                Exposition = package.Metadata.SingleOrDefault(m => m.Key == "expo")?.Value,
                Other = package.Metadata.Where(m => m.Key != "author" && m.Key != "expo")
                    .Select(m => new Other { Key = m.Key, Value = m.Value }).ToList()
            };
            packageDescriptor.Package = new Package
            {
                Url = new Uri(string.Format(_cmtoolboxDownloadUrlBase, package.Id)),
                Checksum = await _packagesClient.GetPackageHashAsync(package.Id)
            };

            if (!string.IsNullOrEmpty(overlay.SyncJson))
            {
                packageDescriptor.Sync = Newtonsoft.Json.JsonConvert.DeserializeObject<Naki3D.Common.Json.Sync>(overlay.SyncJson);
            }
            else
            {
                packageDescriptor.Sync = new Sync();
            }

            var overlaySettings = Newtonsoft.Json.JsonConvert.DeserializeObject<Naki3D.Common.Json.Settings>(overlay.SettingsJson);
            var overlayInputs = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Naki3D.Common.Json.Action>>(overlay.InputsJson);

            if (overlaySettings != null && overlay.OverwriteSettings)
            {
                packageDescriptor.Parameters.Settings = overlaySettings;
            }

            if (overlayInputs != null)
            {
                if (overlay.OverwriteInputs)
                {
                    packageDescriptor.Inputs = overlayInputs;
                }
                else
                {
                    packageDescriptor.Inputs.AddRange(overlayInputs);
                }
            }

            await writer.WriteAsync(packageDescriptor.ToJson());
        }
    }
}