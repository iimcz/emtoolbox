using System.Collections.Generic;

namespace backend.ViewModels
{
    public enum ExhibitConnectionStatus
    {
        Disconnected,
        Pending,
        Connected
    }

    public class ExhibitProperties
    {
        public string Hostname { get; set; }
        public string DeviceType { get; set; }
        public List<string> Tags { get; set; }
        public List<SensorProperties> Sensors { get; set; }
    }
}