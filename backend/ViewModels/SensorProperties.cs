using backend.Model;

namespace backend.ViewModels
{
    public class SensorProperties
    {
        public string Path { get; set; }
        public string FriendlyName { get; set; }
        public DataType ValueType { get; set; }
    }
}