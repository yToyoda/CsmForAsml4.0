using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using SysIO = System.IO;
using CsmForAsml.Models;
using System.Threading.Tasks;

namespace CsmForAsml.Tools {
    /// <summary>
    /// ダウンロード用の Excel file を、ExcelUtils と テンプレートエクセルファイルを使用して作成する。
    /// </summary>
    /// <remarks>
    /// この version では、テンプレートは "EquipmentList_TemplateVer03.xlsx"のシート"Sheet1"を使用することを前提としている    
    /// </remarks>
    public class CreateCalInProcessExcel :ICreateExcelFile<CalInProcess>{
        private readonly IExcelUtil _crExcel ;

        public CreateCalInProcessExcel() {
            _crExcel = new ExcelUtility();
        }
        public CreateCalInProcessExcel(IExcelUtil excelUtil) {
            _crExcel = excelUtil;
        }

        public async Task<MemoryStream> GetExcelStream(IEnumerable<CalInProcess> entries) {
            // using (CreateExcel _crExcel = new CreateExcel()) {

            Dictionary<string, Int32> sharedStringDic = new Dictionary<string, int>();
            const string excelTemplate = "CalInProcessTemplateVer05.xlsx";
            const string sheetname = "Sheet1";

            _crExcel.StartLine = 2;   // add cell from line = 2
            var size = await _crExcel.LoadTemplate(excelTemplate, sheetname);
            // following styles are sprcific to this template            
            _crExcel.StyleDic.Add("Default", 1);
            _crExcel.StyleDic.Add("Gray String", 3);
            _crExcel.StyleDic.Add("Date", 2);
            _crExcel.StyleDic.Add("Green Date", 4);
            _crExcel.StyleDic.Add("Yellow Date", 5);
            _crExcel.StyleDic.Add("Red Date", 6);
            string styleDate = "Date";
            foreach (var calEntry in entries) {                      //Excel Column
                _crExcel.AddCell(calEntry.Plant);                       //A - Plant
                _crExcel.AddCell(calEntry.Location);                    //B - Location
                _crExcel.AddCell(calEntry.SerialNumber);                //C - SerialNumber
                _crExcel.AddCell(calEntry.Material);                    //D - Materail
                _crExcel.AddCell(calEntry.Description);                 //E - Description
                _crExcel.AddCell(calEntry.CalPlace);                    //F - Cal Place
                _crExcel.AddCell(calEntry.CalInterval);                 //G - 校正周期
                _crExcel.AddCell(calEntry.RegisteredDate, styleDate);    //H - 登録日
                _crExcel.AddCell(calEntry.UserShipDate, styleDate);     //I - ASML発送日
                _crExcel.AddCell(calEntry.VenReceiveDate, styleDate);   //J - 受領日
                _crExcel.AddCell(calEntry.CalDate, styleDate);          //K - 校正実施日
                string calresult = "";
                if (calEntry.CalResult != null) {
                    calresult = (bool)calEntry.CalResult ? "GD" : "NG";
                }
                _crExcel.AddCell(calresult);                            //L - 校正結果
                _crExcel.AddCell(calEntry.VenComment);                  //M - コメント
                _crExcel.AddCell(calEntry.PlanedShipDate, styleDate);   //N - 予定出荷日
                _crExcel.AddCell(calEntry.VenShipDate, styleDate);      //O - 返却出荷日
                _crExcel.AddCell(calEntry.UserReceiveDate, styleDate);  //P - ASML受領日
                _crExcel.AddCell(calEntry.CcReceiveDate, styleDate);    //Q - 校正証明書受領日
                _crExcel.AddCell(calEntry.CcUploadDate, styleDate);     //R - 校正証明書登録日
                _crExcel.AddCell(calEntry.StdTat);                      //S - 標準TAT
                _crExcel.AddCell(calEntry.Tat);                         //T - TAT
                _crExcel.AddCell(calEntry.TatStatus);                   //U - ステータス
                string finished = calEntry.Finished ? "Yes" : "No";
                _crExcel.AddCell(finished);                             //V - 完了
                string yearmonth = "";
                if (calEntry.UserShipDate != null) {
                    yearmonth = String.Format("{0:yyyy-MM}", (DateTime)calEntry.UserShipDate);
                }
                _crExcel.AddCell(yearmonth);                            //W - 発送月
                _crExcel.AddCell(calEntry.PMaker);                      //X - P.Maker
                _crExcel.AddCell(calEntry.PModel);                      //X - P.Model
                _crExcel.AddCell(calEntry.PName);                       //Z - P.Name
                _crExcel.AddCell(calEntry.PSN);                         //AA - P.Serial
                _crExcel.EndRow();
            }
            //MemoryStream iost = new MemoryStream();
            return _crExcel.GetExcelFile();                
        }
    }



}