using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CsmForAsml.Models
{
    public partial class Location
    {
        [Key]
        public string Plant { get; set; }
        public string Location1 { get; set; }
    }
}
