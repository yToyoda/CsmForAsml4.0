using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace CsmForAsml.Models
{
    public partial class ToolInventory
    {
        public string SerialNumber { get; set; }
        public string Plant { get; set; }
        public string StoreLocation { get; set; }
        public string Material { get; set; }
        public string Description { get; set; }
        [DisplayFormat(DataFormatString = "{0:yyyy/MM/dd}", ApplyFormatInEditMode = true)]
        public DateTime? LatestCalDate { get; set; }
        public string CalStatus { get; set; }
        public string Comment { get; set; }
        [DisplayFormat(DataFormatString = "{0:yyyy/MM/dd}", ApplyFormatInEditMode = true)]
        public DateTime? CalDue { get; set; }
        public string SystemStatus { get; set; }
        public string UserStatus { get; set; }
        public string Room { get; set; }
        public string SuperordEquip { get; set; }
        public string SortField { get; set; }
        public string Machine { get; set; }
        public string ToolkitMachine { get; set; }
        public string ToolkitSloc { get; set; }
        [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
        public DateTime? LatestSafetyDate { get; set; }
        [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
        public DateTime? SafetyDue { get; set; }
        public bool? NeedCal { get; set; }
        public bool? NeedSafety { get; set; }
        [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
        public DateTime? RemovedDate { get; set; }
        [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
        public DateTime? UpdatedDate { get; set; }
        public bool? InCal { get; set; }
        public string PSN { get; set; }

        [NotMapped]
        public string CalPlace { get; set; }
        [NotMapped]
        public int? CalInterval { get; set; }
        [NotMapped]
        public int? SafetyInterval { get; set; }
        [NotMapped]
        public string Location { get; set; }

        [NotMapped]
        public string CalDueStatus { get; set; }
    }
    
}
