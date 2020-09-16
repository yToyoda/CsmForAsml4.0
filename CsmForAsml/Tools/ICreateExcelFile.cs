using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;

namespace CsmForAsml.Tools {
    public interface ICreateExcelFile<TModel> {
        Task<MemoryStream> GetExcelStream(IEnumerable<TModel> tools);
    }

    public interface IExcelUtil {
        Dictionary<String, UInt32> StyleDic { get; set; }
        UInt32 StartLine { get; set; }
        Task<long> LoadTemplate(string filename, string sheetname);
        void EndRow();
        void AddCell(string value, string cellStyle = "Default");
        void AddCell(DateTime? value, string cellStyle = "Date");
        void AddCell(DateTime value, string cellStyle = "Date");
        void AddCell(int? value, string cellStyle = "Default");
        void AddCell(int value, string cellStyle = "Default");
        void AddCell(double? value, string cellStyle = "Default");
        void AddCell(double value, string cellStyle = "Default");
        System.IO.MemoryStream GetExcelFile();

    }
}
        
