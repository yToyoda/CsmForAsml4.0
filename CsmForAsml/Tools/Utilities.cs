using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CsmForAsml.Models;

namespace CsmForAsml.Tools {
    public class Utilities {
    }

    public static class AppResources {
        public static string TableMark = "[-TABLE-]";
        public static string PDFfileName;
        public static Dictionary<DateTime,string> HolidayDic { get; set; }
        
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

        /// <summary>
        /// どの地域のサーバーで実行されていても、日本時間での現在時刻を返す。 (読取専用)
        /// </summary>
        public static DateTime JSTNow {
            get {
                DateTime utcnow = DateTime.UtcNow;
                TimeZoneInfo jstZoneInfo = TimeZoneInfo.FindSystemTimeZoneById("Tokyo Standard Time");
                DateTime jst = TimeZoneInfo.ConvertTimeFromUtc(utcnow, jstZoneInfo);
                return jst;
            }
        }
        public static DateTime DateAfterNWorkDays(DateTime fromDay, int nWorkDays) {
            DateTime answer = fromDay;
            if (HolidayDic == null) HolidayDic = LoadHolidays();
            string holidayname;
            for (int i = 0; i < nWorkDays; ++i) {
                answer = answer.AddDays(1);
                while (answer.DayOfWeek == DayOfWeek.Saturday || answer.DayOfWeek == DayOfWeek.Sunday || HolidayDic.TryGetValue(answer, out holidayname)) {
                    answer = answer.AddDays(1);
                }
            }
            return answer;
        }

        public static Dictionary<DateTime,string> LoadHolidays() {
            CsmForAsml2Context context = new CsmForAsml2Context();
            var holidays = context.Holidays.ToList();
            Dictionary<DateTime, string> answer = new Dictionary<DateTime, string>();
            foreach (var holiday in holidays) {
                answer.Add( holiday.Date, holiday.HolidayName);
            }
            return answer;
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

    public class FileInfoClass {
        public string FileName { get; set; }
        public long Length { get; set; }
        public byte[] byteArray;
        public FileInfoClass() { }
    }
    public class WorkStatus {
        public string Status { get; set; }
        public string Filename { get; set; }
    }

}
