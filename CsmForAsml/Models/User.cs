using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CsmForAsml.Models {
    public class User {
        public string Id { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Roles { get; set; }
        public bool Administrator { get; set; }
        public bool DataAdmin { get; set; }
        public bool SuperUser { get; set; }
        public bool KyosaiUser { get; set; }
        public bool Supplier { get; set; }
    }
}
