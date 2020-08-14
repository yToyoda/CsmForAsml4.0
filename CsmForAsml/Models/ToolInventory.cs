using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

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

        [NotMapped]
        public string CalPlace { get; set; }
        [NotMapped]
        public int? CalInterval { get; set; }
        [NotMapped]
        public int? SafetyInterval { get; set; }

    }
    /// <summary>
    /// SerialNumber のリスト ブラウザからサーバに選択されている機器を通知するために使用
    /// </summary>
    public class SerialNumList {

        /// <summary>
        /// 管理番号のリスト
        /// </summary>
        public List<string> SerialNumbers { get; set; }
    }
}
