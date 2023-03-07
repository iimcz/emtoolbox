using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace backend.Model
{
    [Index("PackageId")]
    public class PackageOverlay
    {
        [Key]
        public int Id { get; set; }
        public int PackageId { get; set; }
        public bool IsStartupPackage { get; set; }
        public bool OverwriteSettings { get; set; }
        public string SettingsJson { get; set; }
        public bool OverwriteInputs { get; set; }
        public string InputsJson { get; set; }
        public string SyncJson { get; set; }
        public Exhibit AssignedExhibit { get; set; }
    }
}