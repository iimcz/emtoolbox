using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.Model
{
    public class Exposition
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        public string Description { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public ICollection<ExpositionMetadata> Metadata { get; set; }
        public string ExhibitGraph { get; set; }
    }
}