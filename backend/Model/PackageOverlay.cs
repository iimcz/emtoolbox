using System.ComponentModel.DataAnnotations;

namespace backend.Model
{
    public class PackageOverlay
    {
        [Key]
        public int Id { get; set; }
        public int PackageId { get; set; }
        public bool OverwriteSettings { get; set; }
        public string Settings { get; set; }
        public bool OverwriteInputs { get; set; }
        public string Inputs { get; set; }
        public string Sync { get; set; }
    }
}