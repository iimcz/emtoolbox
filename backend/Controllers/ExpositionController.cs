using System.Threading.Tasks;
using backend.Model;
using backend.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

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
        public async Task<ActionResult> New([FromBody] ExpositionProperties properties)
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
            return Ok(exposition.Id);
        }

        [HttpGet("properties/{id}")]
        public async Task<ActionResult> GetProperties(int id)
        {
            Exposition exposition = await _dbContext.Expositions.FindAsync(id);
            if (exposition == null)
                return NotFound();

            return Ok(new ExpositionProperties
            {
                Id = exposition.Id,
                Name = exposition.Name,
                Description = exposition.Description,
                StartDate = exposition.StartDate,
                EndDate = exposition.EndDate
            });
        }

        [HttpPost("properties/{id}")]
        public async Task<ActionResult> SetProperties(int id, [FromBody] ExpositionProperties properties)
        {
            Exposition exposition = await _dbContext.Expositions.FindAsync(id);
            if (exposition == null)
                return NotFound();

            exposition.Name = properties.Name;
            exposition.Description = properties.Description;
            exposition.StartDate = properties.StartDate;
            exposition.EndDate = properties.EndDate;
            await _dbContext.SaveChangesAsync();

            return Ok();
        }

        [HttpGet("graph/{id}")]
        public async Task<ActionResult> GetGraph(int id)
        {
            Exposition exposition = await _dbContext.Expositions.FindAsync(id);
            if (exposition == null)
                return NotFound();

            return Ok(exposition.ExhibitGraph);
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
    }
}