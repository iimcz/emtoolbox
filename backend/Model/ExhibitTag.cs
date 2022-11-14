using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.Model
{
    public class ExhibitTag
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Tag { get; set; }
        public ICollection<Exhibit> Exhibits { get; set; }
    }
}