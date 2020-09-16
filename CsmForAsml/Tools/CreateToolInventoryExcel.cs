using CsmForAsml.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;

namespace CsmForAsml.Tools {
    public class CreateToolInventoryExcel : ICreateExcelFile<ToolInventory> {
        private readonly IExcelUtil _crExcel;

        /// <summary>
        /// デフォールトのコンストラクタ
        /// </summary>
        /*
        public CreateToolInventoryExcel() {
            _crExcel = new ExcelUtility();
        }
        */
        public CreateToolInventoryExcel(IExcelUtil crExcel) {
            _crExcel = crExcel;
        }
        
        public async Task<MemoryStream> GetExcelStream(IEnumerable<ToolInventory> tools) {

            //using (CreateExcel _crExcel = new CreateExcel()) {

            Dictionary<string, Int32> sharedStringDic = new Dictionary<string, int>();
            const string overdue = "OverDue";
            const string dueThisMonth = "DueTM";
            const string dueNextMonth = "DueNM";
            const string excelTemplate = "InventoryTemplateVer02.xlsx";
            const string sheetname = "Sheet1";

            _crExcel.StartLine = 2;   // add cell from line = 2
            await _crExcel.LoadTemplate(excelTemplate, sheetname);
            // following styles are sprcific to this template            
            _crExcel.StyleDic.Add("Default", 1);
            _crExcel.StyleDic.Add("Gray String", 3);
            _crExcel.StyleDic.Add("Date", 2);
            _crExcel.StyleDic.Add("Green Date", 4);
            _crExcel.StyleDic.Add("Yellow Date", 5);
            _crExcel.StyleDic.Add("Red Date", 6);
            string styleDate = "Date";
            foreach (var tool in tools) {                      //Excel Column
                _crExcel.AddCell(tool.Plant);                       //A - Plant
                _crExcel.AddCell(tool.Location);                    //B - Location
                _crExcel.AddCell(tool.ToolkitSloc);                 //C - Toolkit_sloc
                _crExcel.AddCell(tool.SerialNumber);                //D - SerialNumber
                _crExcel.AddCell(tool.Material);                    //E - Materail
                _crExcel.AddCell(tool.Description);                 //F - Description
                _crExcel.AddCell(tool.LatestCalDate, styleDate);     //G - Latest_Cal_Date
                string style = "Date";
                switch (tool.CalStatus) {
                    case dueNextMonth:
                        style = "Green Date";
                        break;
                    case dueThisMonth:
                        style = "Yellow Date";
                        break;
                    case overdue:
                        style = "Red Date";
                        break;
                }
                _crExcel.AddCell(tool.CalStatus, style);             //H - CalStatus (Cal Due Satus)
                _crExcel.AddCell(tool.Comment);                     //I - Comment
                _crExcel.AddCell(tool.CalDue, style);           //J - CalDue
                _crExcel.AddCell(tool.CalPlace, styleDate);         //K - Cal_Place
                _crExcel.AddCell(tool.CalInterval);                 //L - CalInerval
                _crExcel.AddCell(tool.StoreLocation);               //M - Store_Location
                _crExcel.AddCell(tool.SystemStatus);                //N - System_Status
                _crExcel.AddCell(tool.UserStatus);                  //O - User_status
                _crExcel.AddCell(tool.Room);                        //P - Room
                _crExcel.AddCell(tool.SuperordEquip);               //Q - SuperordEquip
                _crExcel.AddCell(tool.SortField);                   //R - Sort_field
                _crExcel.AddCell(tool.Machine);                     //S - Machine
                _crExcel.AddCell(tool.ToolkitMachine);              //T - Toolkit_Machine
                _crExcel.EndRow();
            }
            return _crExcel.GetExcelFile();
        }
    }
}
