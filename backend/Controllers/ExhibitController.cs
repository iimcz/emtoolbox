using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using backend.Communication;
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
        private ILogger<ExhibitController> _logger;
        private ExhibitConnectionManager _connectionManager;
        private EmtContext _dbContext;

        public ExhibitController(ILogger<ExhibitController> logger, ExhibitConnectionManager connectionManager, EmtContext dbContext)
        {
            _logger = logger;
            _connectionManager = connectionManager;
            _dbContext = dbContext;
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
                Sensors = ex.Sensors.Select(s => new SensorProperties {
                    Path = s.Path,
                    FriendlyName = s.FriendlyName,
                    ValueType = s.ValueType
                }).ToList(),
                Tags = ex.Tags.Select(t => t.Tag).ToList()
            }).ToList();

            exhibits.AddRange(_connectionManager.GetPendingConnections().Select(pc => new ExhibitProperties { Hostname = pc }));
            return exhibits;
        }

        [HttpPost("send/{exhibit_id}/{package_id}")]
        public async Task<ActionResult> SendPackage(string exhibit_id, int package_id)
        {
            // TODO: implement
            // PresentationPackage package = await _dbContext.PresentationPackages
            //     .Include(p => p.DataFiles)
            //     .Include(p => p.Metadata)
            //     .AsSplitQuery()
            //     .SingleOrDefaultAsync(p => p.Id == package_id);
            // if (package == null)
            //     return NotFound();

            // if (package.State != PackageState.Finished)
            //     return BadRequest();

            // // First clear, then load the new package.
            // _connectionManager.ClearPackage(exhibit_id);

            // using (var writer = new StringWriter())
            // {
            //     string filepath = Path.Combine(_basePackageDir, String.Format("{0}.zip", package.Id));
            //     string pkgurl = _useHttps ? "https://" : "http://";
            //     pkgurl += String.Format("{0}:5000/packages/download/{1}", _connectionManager.GetInterfaceAddressFor(exhibit_id), package.Id);
            //     await PackageUtils.WritePackageJsonAsync(package, writer, filepath, pkgurl);
            //     _connectionManager.LoadPackage(exhibit_id, writer.ToString());
            // }

            return Ok();
        }
    }
}