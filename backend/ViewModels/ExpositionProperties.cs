using System;
using System.Collections.Generic;

namespace backend.ViewModels
{
    public class ExpositionMeta
    {
        public string Key { get; set; }
        public string Value { get; set; }
    }

    public class ExpositionProperties
    {
        public int? Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public List<ExpositionMeta> Metadata { get; set; }
    }
}