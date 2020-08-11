using System;
using System.Collections.Generic;

namespace CsmForAsml.Models
{
    public partial class ToolInventory
    {
        public string SerialNumber { get; set; }
        public string Plant { get; set; }
        public string StoreLocation { get; set; }
        public string Material { get; set; }
        public string Description { get; set; }
        public DateTime? LatestCalDate { get; set; }
        public string CalStatus { get; set; }
        public string Comment { get; set; }
        public DateTime? CalDue { get; set; }
        public string SystemStatus { get; set; }
        public string UserStatus { get; set; }
        public string Room { get; set; }
        public string SuperordEquip { get; set; }
        public string SortField { get; set; }
        public string Machine { get; set; }
        public string ToolkitMachine { get; set; }
        public string ToolkitSloc { get; set; }
        public DateTime? LatestSafetyDate { get; set; }
        public DateTime? SafetyDue { get; set; }
        public bool? NeedCal { get; set; }
        public bool? NeedSafety { get; set; }
        public DateTime? RemovedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public bool? InCal { get; set; }
        public string PSN { get; set; }
    }
    // cal interval , safety interval が無い
}
