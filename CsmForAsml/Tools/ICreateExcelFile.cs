using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;

namespace CsmForAsml.Tools {
    public interface ICreateExcelFile<TModel> {
        Task<MemoryStream> GetExcelStream(IEnumerable<TModel> tools);
    }
}
