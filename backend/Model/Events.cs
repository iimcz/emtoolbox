namespace backend.Model
{
    public enum EventType
    {
        ConnectionsUpdated
    }

    public class EventMessage
    {
        public EventType Type { get; set; }
    }

    public class EventResponse
    {

    }
}