using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using backend.Communication;
using backend.Generated.CMToolbox;
using backend.Model;
using backend.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Naki3D.Common.Json;

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
            await _connectionManager.AcceptPendingConnection(id);
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
            await _connectionManager.CloseConnection(id);
            Exhibit exhibit = await _dbContext.Exhibits.FirstOrDefaultAsync(ex => ex.Hostname == id);
            if (exhibit != null)
            {
                _dbContext.Exhibits.Remove(exhibit);
                await _dbContext.SaveChangesAsync();
            }
            return Ok();
        }

        [HttpPost("reload/{exhibit_id}")]
        public async Task<ActionResult> ReloadExhibit(string exhibit_id)
        {
            Exhibit exhibit = await _dbContext.Exhibits.Include(ex => ex.Sensors).Include(ex => ex.Tags).FirstOrDefaultAsync(ex => ex.Hostname == exhibit_id);
            if (exhibit == null)
                return NotFound();

            await _connectionManager.ReloadDescriptor(exhibit_id);
            return Ok();
        }

        [HttpGet("all")]
        public async Task<List<ExhibitProperties>> GetAllExhibits()
        {
            List<ExhibitProperties> exhibits = await _dbContext.Exhibits.Include(ex => ex.Sensors).Include(ex => ex.Tags).Select(ex => new ExhibitProperties
            {
                Hostname = ex.Hostname,
                DeviceType = ex.DeviceType,
                Sensors = ex.Sensors.Select(s => new SensorProperties
                {
                    Path = s.Path,
                    FriendlyName = s.FriendlyName,
                    ValueType = s.ValueType
                }).ToList(),
                Tags = ex.Tags.Select(t => t.Tag).ToList()
            }).ToListAsync();

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
                DeviceType = exhibit.DeviceType,
                Sensors = exhibit.Sensors.Select(s => new SensorProperties
                {
                    Path = s.Path,
                    FriendlyName = s.FriendlyName,
                    ValueType = s.ValueType
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

            _logger.LogInformation("Sending packages for exposition: {0} ({1})", exposition.Name, exposition.Id);
            var startupOverlays = new List<PackageOverlay>();
            foreach (var overlay in exposition.PackageOverlays)
            {
                _logger.LogInformation(" - Sending package {0} to {1} (Is startup: {3})", overlay.PackageId, overlay.AssignedExhibit.Hostname, overlay.IsStartupPackage);

                PresentationPackage package = await _packagesClient.GetPackageAsync(overlay.PackageId);

                using (var writer = new StringWriter())
                {
                    await WritePackageJsonAsync(package, overlay, writer);
                    await _connectionManager.LoadPackage(overlay.AssignedExhibit.Hostname, writer.ToString());
                }

                if (overlay.IsStartupPackage)
                {
                    startupOverlays.Add(overlay);
                }
            }

            foreach (var overlay in startupOverlays)
            {
                _logger.LogInformation(" = Setting package {0} on {1} as startup package", overlay.PackageId, overlay.AssignedExhibit.Hostname);
                await _connectionManager.SetStartupPackage(overlay.AssignedExhibit.Hostname, overlay.PackageId.ToString());
                _logger.LogInformation(" = Starting package {0} on {1}", overlay.PackageId, overlay.AssignedExhibit.Hostname);
                await _connectionManager.StartPackage(overlay.AssignedExhibit.Hostname, overlay.PackageId.ToString());
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
                Id = package.Id.ToString(),
                Title = package.Name,
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