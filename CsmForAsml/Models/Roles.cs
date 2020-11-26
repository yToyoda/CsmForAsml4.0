using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CsmForAsml.Models {
    public static class Roles {
        private static string[] _rnames = { "Administrator", "DataAdmin", "KyosaiUser", "SuperUser", "Supplier" };
        public static List<string> RoleNames { get { return _rnames.ToList(); } }
        public static string Administrator { get { return _rnames[0]; } }
        public static string DataAdmin { get { return _rnames[1]; } }
        public static string KyosaiUser { get { return _rnames[2]; } }
        public static string SuperUser { get { return _rnames[3]; } }
        public static string Supplier { get { return _rnames[4]; } }
    }

}
