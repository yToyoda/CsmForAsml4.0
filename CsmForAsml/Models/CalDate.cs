using System;
using System.Collections.Generic;

namespace CsmForAsml.Models
{
    public partial class CalDate
    {
        public int Id { get; set; }
        public string Serial { get; set; }
        public DateTime CalDate1 { get; set; }
        public string CalStatus { get; set; }
        public string PdfFileName { get; set; }
        public string Comment { get; set; }
        public bool? IsCal { get; set; }
    }
}
