using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.Model
{
    public class Exhibit
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Hostname { get; set; }
        public string DeviceType { get; set; }
        public Exposition CurrentExposition { get; set; }
        public Exposition PlannedExposition { get; set; }
        public List<Sensor> Sensors { get; set; }
        public int? LastLoadedPackage { get; set; }
        public ICollection<ExhibitTag> Tags { get; set; }
    }
}