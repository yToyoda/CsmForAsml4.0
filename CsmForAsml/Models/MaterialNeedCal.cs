using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CsmForAsml.Models
{
    public partial class MaterialNeedCal
    {
        public string Material { get; set; }
        public string MaterialDescription { get; set; }
        public string CalPlace { get; set; }
        public string CalVendor { get; set; }
        public int? CalInterval { get; set; }
        public string Instruction { get; set; }
        public string AddRemove { get; set; }
        [DisplayFormat(DataFormatString="yyyy/MM/dd")]
        public DateTime? ChangeDate { get; set; }
        public bool? NeedCal { get; set; }
        public bool? NeedSafety { get; set; }
        public int? SafetyInterval { get; set; }
        public string PMaker { get; set; }
        public string PName { get; set; }
        public string PModel { get; set; }
        public decimal? PriceToUser { get; set; }
        public decimal? PriceFromVendor { get; set; }
        public int? Std_TAT { get; set; }
    }
}
