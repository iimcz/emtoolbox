namespace backend.ViewModels
{
    public enum PackageType
    {
        Panorama,
        Scene,
        Video,
        Model,
        Gallery
    }

    public class PackageProperties
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public PackageType Type { get; set; }
    }
}