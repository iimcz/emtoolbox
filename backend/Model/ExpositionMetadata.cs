using System.ComponentModel.DataAnnotations;

namespace backend.Model
{
    public class ExpositionMetadata
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Key { get; set; }
        [Required]
        public string Value { get; set; }
    }
}