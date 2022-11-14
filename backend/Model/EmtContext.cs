using Microsoft.EntityFrameworkCore;

namespace backend.Model
{
    public class EmtContext : DbContext
    {
        public DbSet<Exposition> Expositions { get; set; }
        public DbSet<Exhibit> Exhibits { get; set; }
        public DbSet<Sensor> ExhibitSensors { get; set; }

        public EmtContext(DbContextOptions<EmtContext> options) : base(options)
        {
            Database.EnsureCreated();
            Database.Migrate();
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
        }
    }
}