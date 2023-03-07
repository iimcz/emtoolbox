using System.Threading.Tasks;
using backend.Model;
using backend.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ExpositionController : ControllerBase
    {
        ILogger<ExpositionController> _logger;
        EmtContext _dbContext;

        public ExpositionController(ILogger<ExpositionController> logger, EmtContext dbContext)
        {
            this._logger = logger;
            this._dbContext = dbContext;
        }

        [HttpPost("new")]
        public async Task<ActionResult<ExpositionProperties>> New([FromBody] ExpositionProperties properties)
        {
            Exposition exposition = new Exposition
            {
                Name = properties.Name,
                StartDate = properties.StartDate,
                EndDate = properties.EndDate,
                Description = properties.Description
            };
            _dbContext.Expositions.Add(exposition);
            await _dbContext.SaveChangesAsync();
            properties.Id = exposition.Id;
            return Ok(properties);
        }

        [HttpGet("all")]
        public IEnumerable<ExpositionProperties> GetAll() => _dbContext.Expositions.Select(ex => new ExpositionProperties
        {
            Id = ex.Id,
            Name = ex.Name,
            Description = ex.Description,
            StartDate = ex.StartDate,
            EndDate = ex.EndDate
        });

        [HttpGet("properties/{id}")]
        public async Task<ActionResult<ExpositionProperties>> GetProperties(int id)
        {
            Exposition exposition = await _dbContext.Expositions.FindAsync(id);
            if (exposition == null)
                return NotFound();
            _dbContext.Entry(exposition).Collection(ex => ex.Metadata).Load();

            return new ExpositionProperties
            {
                Id = exposition.Id,
                Name = exposition.Name,
                Description = exposition.Description,
                StartDate = exposition.StartDate,
                EndDate = exposition.EndDate,
                Metadata = exposition.Metadata.Select(m => new ExpositionMeta
                {
                    Key = m.Key,
                    Value = m.Value
                }).ToList()
            };
        }

        [HttpPost("properties/{id}")]
        public async Task<ActionResult> SetProperties(int id, [FromBody] ExpositionProperties properties)
        {
            Exposition exposition = await _dbContext.Expositions.Include(ex => ex.Metadata).FirstOrDefaultAsync(ex => ex.Id == id);
            if (exposition == null)
                return NotFound();

            exposition.Name = properties.Name;
            exposition.Description = properties.Description;
            exposition.StartDate = properties.StartDate;
            exposition.EndDate = properties.EndDate;

            if (properties.Metadata != null)
            {
                exposition.Metadata.Clear();
                foreach (var meta in properties.Metadata)
                {
                    exposition.Metadata.Add(new ExpositionMetadata
                    {
                        Key = meta.Key,
                        Value = meta.Value
                    });
                }
            }
            await _dbContext.SaveChangesAsync();

            return Ok();
        }

        [HttpGet("graph/{id}")]
        public async Task<ActionResult<string>> GetGraph(int id)
        {
            Exposition exposition = await _dbContext.Expositions.FindAsync(id);
            if (exposition == null)
                return NotFound();

            return exposition.ExhibitGraph;
        }

        [HttpPost("graph/{id}")]
        public async Task<ActionResult> SetGraph(int id, [FromBody] string graph)
        {
            Exposition exposition = await _dbContext.Expositions.FindAsync(id);
            if (exposition == null)
                return NotFound();

            exposition.ExhibitGraph = graph;
            await _dbContext.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("overlay/{id}/new")]
        public async Task<ActionResult<PackageOverlayProperties>> AddPackageOverlay(int id, [FromBody] NewOverlayProperties newOverlay)
        {
            Exposition exposition = await _dbContext.Expositions
                .Include(ex => ex.PackageOverlays)
                .ThenInclude(po => po.AssignedExhibit)
                .FirstOrDefaultAsync(ex => ex.Id == id);
            if (exposition == null)
                return NotFound();
            Exhibit exhibit = await _dbContext.Exhibits.FirstOrDefaultAsync(ex => ex.Hostname == newOverlay.ExhibitId);
            if (exhibit == null)
                return NotFound();
            

            var overlay = new PackageOverlay
            {
                PackageId = newOverlay.PackageId,
                AssignedExhibit = exhibit,
                OverwriteInputs = false,
                InputsJson = string.Empty,
                OverwriteSettings = false,
                SettingsJson = string.Empty,
                SyncJson = "{}",
                IsStartupPackage = false,
            };
            exposition.PackageOverlays.Add(overlay);
            await _dbContext.SaveChangesAsync();

            return new PackageOverlayProperties {
                Id = overlay.Id,
                PackageId = overlay.PackageId,
                IsStartupPackage = overlay.IsStartupPackage,
                OverwriteInputs = overlay.OverwriteInputs,
                Inputs = overlay.InputsJson,
                OverwriteSettings = overlay.OverwriteSettings,
                Settings = overlay.SettingsJson,
                Sync = overlay.SyncJson
            };
        }

        [HttpPost("overlay/{id}/{overlayId}")]
        public async Task<ActionResult> SetPackageOverlay(int id, int overlayId, [FromBody] PackageOverlayProperties pkgOverlay)
        {
            Exposition exposition = await _dbContext.Expositions
                .Include(ex => ex.PackageOverlays)
                .ThenInclude(ov => ov.AssignedExhibit)
                .FirstOrDefaultAsync(ex => ex.Id == id);
            if (exposition == null)
                return NotFound();

            PackageOverlay overlay = exposition.PackageOverlays.FirstOrDefault(o => o.Id == overlayId);
            if (overlay == null)
                return NotFound();
    
            overlay.InputsJson = pkgOverlay.Inputs;
            overlay.OverwriteInputs = pkgOverlay.OverwriteInputs;
            overlay.SettingsJson = pkgOverlay.Settings;
            overlay.OverwriteSettings = pkgOverlay.OverwriteSettings;
            overlay.SyncJson = pkgOverlay.Sync;

            await _dbContext.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("overlay/{id}/{overlayId}")]
        public async Task<ActionResult<PackageOverlayProperties>> GetPackageOverlay(int id, int overlayId)
        {
            Exposition exposition = await _dbContext.Expositions
                .Include(ex => ex.PackageOverlays)
                .FirstOrDefaultAsync(ex => ex.Id == id);
            if (exposition == null)
                return NotFound();

            PackageOverlay overlay = exposition.PackageOverlays.FirstOrDefault(o => o.Id == overlayId);
            if (overlay == null)
                return NotFound();

            return new PackageOverlayProperties
            {

            };
        }

        [HttpGet("overlay/{id}/find/{exhibitId}")]
        public async Task<IEnumerable<PackageOverlayProperties>> FindPackageOverlays(int id, string exhibitId)
        {
            Exposition exposition = await _dbContext.Expositions
                .Include(ex => ex.PackageOverlays)
                .ThenInclude(ov => ov.AssignedExhibit)
                .FirstOrDefaultAsync(ex => ex.Id == id);

            if (exposition == null)
                return null;

            var overlays = exposition.PackageOverlays
                .Where(ov => ov.AssignedExhibit.Hostname == exhibitId)
                .Select(ov => new PackageOverlayProperties {
                    Id = ov.Id,
                    PackageId = ov.PackageId,
                    IsStartupPackage = ov.IsStartupPackage,
                    OverwriteInputs = ov.OverwriteInputs,
                    Inputs = ov.InputsJson,
                    OverwriteSettings = ov.OverwriteSettings,
                    Settings = ov.SettingsJson,
                    Sync = ov.SyncJson
                });
            return overlays;
        }

        [HttpDelete("overlay/{id}/{overlayId}")]
        public async Task<ActionResult> DeletePackageOverlay(int id, int overlayId)
        {
            Exposition exposition = await _dbContext.Expositions.FindAsync(id);
            if (exposition == null)
                return NotFound();
            await _dbContext.Entry(exposition).Collection<PackageOverlay>(ex => ex.PackageOverlays).LoadAsync();
            PackageOverlay overlay = exposition.PackageOverlays.FirstOrDefault(o => o.Id == overlayId);
            if (overlay == null)
                return NotFound();
            exposition.PackageOverlays.Remove(overlay);
            await _dbContext.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("overlay/{id}/all")]
        public async Task<ActionResult> DeletePackageOverlays(int id)
        {
            Exposition exposition = await _dbContext.Expositions.FindAsync(id);
            if (exposition == null)
                return NotFound();
            await _dbContext.Entry(exposition).Collection<PackageOverlay>(ex => ex.PackageOverlays).LoadAsync();
            exposition.PackageOverlays.Clear();
            await _dbContext.SaveChangesAsync();
            return Ok();
        }
    }
}