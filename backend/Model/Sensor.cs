using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace backend.Model
{
    public class Sensor
    {
        [Key]
        public int Id { get; set; }
        public int ExhibitId { get; set; }
        public DataType ValueType { get; set; }
        public string FriendlyName { get; set; }
        [Required]
        public string Path { get; set; }
    }

    public class WeakSensorComparer : IEqualityComparer<Sensor>
    {
        public bool Equals(Sensor x, Sensor y)
        {
            return x.Path == y.Path && x.ValueType == y.ValueType;
        }

        public int GetHashCode([DisallowNull] Sensor obj)
        {
            return obj.Path.GetHashCode() + obj.ValueType.GetHashCode();
        }
    }
}