using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace CsmForAsml.Models
{
    public partial class CalDate
    {
        public int Id { get; set; }
        public string Serial { get; set; }

        [DisplayName("Cal Date")]
        public DateTime CalDate1 { get; set; }
        public string CalStatus { get; set; }
        
        [DisplayName("Attached Files")]
        public string PdfFileName { get; set; }
        public string Comment { get; set; }
        public bool? IsCal { get; set; }

        [DisplayName("Cal/Safety")]
        [NotMapped]
        public string KindOfCal { get; set; }
        
        [DisplayName("URL")]
        [DataType(DataType.Url)]
        [NotMapped]
        public string urlToFile { get; set; }
    }
}
