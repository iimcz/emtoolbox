using System.ComponentModel.DataAnnotations;

namespace backend.Model
{
    public class Sensor
    {
        [Key]
        public int Id { get; set; }
        public ValueType ValueType { get; set; }
        public string FriendlyName { get; set; }
        [Required]
        public string Path { get; set; }
    }
}