using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CsmForAsml.Tools {
    public class Utilities {
    }

    public static class AppResources {
        public static string TableMark = "[-TABLE-]";
        public static string PDFfileName;
        
        public static string calCertFolder = Startup.AppSettings["PdfFolder"];
        public static string GetCalCertPath(string calCertFilename) {
            string subfolder = GetCalCertFolder(calCertFilename);
            return System.IO.Path.Combine(calCertFolder, subfolder, calCertFilename);
        }

        public static string GetCalCertFolder(string calCertFilename) {
            string subfolder;
            if (calCertFilename.StartsWith("Calibration")) {
                subfolder = "ClassicalFormat";
            } else {
                subfolder = GetYearFromFilename(calCertFilename);
            }
            return subfolder;
        }
        private static string GetYearFromFilename(string s) {
            string year = "";
            int p = 0;
            while (p < s.Length && !Char.IsDigit(s[p])) ++p;     // skip if current char is not Digit
            while (p < s.Length && Char.IsDigit(s[p])) {
                year = year + s[p];
                ++p;
            }
            return year;
        }

        public static Int32 AddToSharedString(this Dictionary<string, Int32> dictionary, string key) {
            Int32 id = -1;
            if (key == null) key = "";  // null to empty string
            if (dictionary.TryGetValue(key, out id)) {
                return id;
            } else {
                id = dictionary.Count;
                dictionary.Add(key, id);
                return id;
            }
        }
        public static DateTime FirstDayOfNMonth(this DateTime day, Int32 nmonths) {
            Int32 year = day.Year, month = day.Month, month2;
            month += nmonths;
            if (month > 0) {
                month2 = (month - 1) % 12 + 1;
                year += (month - 1) / 12;
            } else {
                month2 = (month + 1200 - 1) % 12 + 1;    // max negative month = 1200
                year = year - 1 - ((-month) / 12);
            }
            return new DateTime(year, month2, 1);
        }
        public static DateTime LastDayOfNMonth(this DateTime day, Int32 nmonths) {
            TimeSpan oneDay = new TimeSpan(1, 0, 0, 0);
            return day.FirstDayOfNMonth(nmonths + 1).Subtract(oneDay);
        }
    }
    public static class RoleNames {
        public static string Admin { get; } = "Administrator";
        public static string DataAdmin { get; } = "DataAdmin";
        public static string SuperUser { get; } = "SuperUser";
        public static string Supplier { get; } = "Supplier";
        public static string KyosaiUser { get; } = "KyosaiUser";
        public static string[] Roles = { "User", "SuperUser", "KyosaiUser", "DataAdmin", "Administrator", "Supplier" };
    }
}
