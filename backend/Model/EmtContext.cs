using System.Collections.Generic;
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


            Exhibit[] exhibits = new Exhibit[] {
                new Exhibit() {
                    Id = 1,
                    Hostname = "pgebox"
                },
                new Exhibit() {
                    Id = 2,
                    Hostname = "ipw2"
                }
            };

            builder.Entity<Exhibit>().HasData(exhibits);

            List<Sensor> sensors = new List<Sensor>()
            {
                new Sensor() {
                    Id = 1,
                    ExhibitId = exhibits[0].Id,
                    Path = "raspi-1-ir-1",
                    ValueType = DataType.Bool
                },
                new Sensor() {
                    Id = 2,
                    ExhibitId = exhibits[0].Id,
                    Path = "rpi-camera",
                    ValueType = DataType.Void
                },
                new Sensor() {
                    Id = 3,
                    ExhibitId = exhibits[1].Id,
                    Path = "raspi-1-ir-1",
                    ValueType = DataType.Bool
                },
                new Sensor() {
                    Id = 4,
                    ExhibitId = exhibits[1].Id,
                    Path = "1",
                    ValueType = DataType.Void
                }
            };

            builder.Entity<Sensor>().HasData(sensors);
        }
    }
}