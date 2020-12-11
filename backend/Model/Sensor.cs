namespace backend.Model
{
    public enum SensorType
    {
        Skeleton,
        Motion,
        MicVolume,
    }

    public class Sensor
    {
        public SensorType SensorType { get; set; }
    }
}