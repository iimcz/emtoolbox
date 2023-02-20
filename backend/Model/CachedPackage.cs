using System;

namespace backend.Model
{
    public class CachedPackage
    {
        public DateTime DownloadTime { get; set; }
        public string PackageId { get; set; }
        public string Checksum { get; set; }
    }
}