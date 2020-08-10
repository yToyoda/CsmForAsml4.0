using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CsmForAsml.Models
{
    public partial class HolidayEntry
    {
        [Key]
        [DisplayFormat(DataFormatString = "{0:yyyy/MM/dd}")]
        public DateTime Date { get; set; }
        public string HolidayName { get; set; }
    }
}
