using backend;

namespace Naki3D.Common.Protocol
{
    public partial class SensorDescriptor
    {
        public backend.Model.DataType MapDataType() => DataType switch
        {
            Naki3D.Common.Protocol.DataType.Void => backend.Model.DataType.Void,
            Naki3D.Common.Protocol.DataType.Bool => backend.Model.DataType.Bool,
            Naki3D.Common.Protocol.DataType.Integer => backend.Model.DataType.Integer,
            Naki3D.Common.Protocol.DataType.Float => backend.Model.DataType.Float,
            Naki3D.Common.Protocol.DataType.String => backend.Model.DataType.String,

            Naki3D.Common.Protocol.DataType.Vector2 => backend.Model.DataType.Vector2,
            Naki3D.Common.Protocol.DataType.Vector3 => backend.Model.DataType.Vector3,

            // Catchall - should not happen
            _ => backend.Model.DataType.Void
        };

        public string CreateFriendlyName() => $"{this.Model} [{this.DataType.ToString()}] @ {this.Path}";
    }
}