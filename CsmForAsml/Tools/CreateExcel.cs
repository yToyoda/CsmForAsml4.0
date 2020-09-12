using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.WindowsAzure.Storage; // Namespace for CloudStorageAccount
using Microsoft.WindowsAzure.Storage.Blob; // Namespace for Blob storage types
using SysIO = System.IO;
using CsmForAsml.Models;

namespace CsmForAsml.Tools {
    public class CreateExcelFile {
        private List<ToolInventory> filteredData;
        public CreateExcelFile() {
            filteredData = new List<ToolInventory>();
        }

        public void Add(ToolInventory ti) {
            filteredData.Add(ti);
        }


        public async Task< FileInfo> GetExcelFile() {
            Dictionary<string, Int32> sharedStringDic = new Dictionary<string, int>();
            const string excelTemplate = "Tools_CalDue_Template.xlsx";
            const string sheetname = "Sheet1";
            const int styleString = 0; // for this template
            const int styleDate = 3; // for this template
            string providername = Startup.AppSettings["StorageProvider"];
            string folder = Startup.AppSettings["PdfFoldername"];
            
            FileInfo fileinfo;
            Int32 sharedStringId = 0;
            UInt32 lineIndex;

            SysIO.MemoryStream ms = new SysIO.MemoryStream(); ;

            if (providername == "localfile") {                
                string filepath = SysIO.Path.Combine(folder, excelTemplate);
                //fileinfo.FileByteStream = SysIO.File.Open(filepath, SysIO.FileMode.Open);
                SysIO.FileStream fs;
                fs = SysIO.File.Open(filepath, System.IO.FileMode.Open);
                fs.CopyTo(ms);
                long bytesInStream = ms.Length;
                fs.Close();

            } else if (providername == "AzureBlob") {
                string connectionstring = Startup.AppSettings["AzureBlob"];
                CloudStorageAccount storageAccount = CloudStorageAccount.Parse(connectionstring);
                CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();
                CloudBlobContainer container = blobClient.GetContainerReference("templates");
                CloudBlockBlob blockBlob = container.GetBlockBlobReference(excelTemplate);
                SysIO.Stream frs = await blockBlob.OpenReadAsync();
                frs.CopyTo(ms);
                long bytesInStream = ms.Length;
                bool canread = ms.CanRead;
                bool canwrite = ms.CanWrite;
                frs.Close();
            }
            SpreadsheetDocument document = SpreadsheetDocument.Open(ms, true);
            WorkbookPart wbPart = document.WorkbookPart;
            Sheet theSheet = wbPart.Workbook.Descendants<Sheet>().Where(s => s.Name == sheetname).FirstOrDefault();
            if (theSheet == null) {
                throw new ArgumentException("sheetName");
            }
            WorksheetPart wsPart = (WorksheetPart)(wbPart.GetPartById(theSheet.Id));
            Worksheet ws = wsPart.Worksheet;
            Columns columns = ws.Descendants<Columns>().FirstOrDefault();
            SheetData sheetData = ws.Descendants<SheetData>().FirstOrDefault();
            Row firstRow = sheetData.Descendants<Row>().ElementAt(0); // get first row , line 1
            firstRow.DyDescent = 0.3D;
            Row secondRow = sheetData.Descendants<Row>().ElementAt(1); // get second row , line 2
            secondRow.Remove();
            SharedStringTablePart sharedStringPart = wbPart.GetPartsOfType<SharedStringTablePart>().First();
            SharedStringTable sharedStringTable = sharedStringPart.SharedStringTable;
            foreach (SharedStringItem item in sharedStringTable.Elements<SharedStringItem>()) {  // read shared string and add to Dictionary
                if (item.InnerText != null) {
                    sharedStringDic.Add(item.InnerText, sharedStringId);
                    ++sharedStringId;
                }
            }

            lineIndex = 2;
            string id;
            // StoreLocation が column "B" と "M" の 2箇所にある
            foreach (var tool in filteredData) {

                Row newRow = new Row() { RowIndex = lineIndex, Spans = new ListValue<StringValue>() { InnerText = "1:20" }, Height = 16.5D, CustomHeight = true, DyDescent = 0.3D };

                Cell cell1 = new Cell() { CellReference = "A" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.Plant).ToString();
                cell1.CellValue = new CellValue(id);

                Cell cell2 = new Cell() { CellReference = "B" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.StoreLocation).ToString();
                cell2.CellValue = new CellValue(id);

                Cell cell3 = new Cell() { CellReference = "C" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.ToolkitSloc).ToString();
                cell3.CellValue = new CellValue(id);

                Cell cell4 = new Cell() { CellReference = "D" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.SerialNumber).ToString();
                cell4.CellValue = new CellValue(id);

                Cell cell5 = new Cell() { CellReference = "E" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.Material).ToString();
                cell5.CellValue = new CellValue(id);

                Cell cell6 = new Cell() { CellReference = "F" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.Description).ToString();
                cell6.CellValue = new CellValue(id);

                Cell cell7 = new Cell() { CellReference = "G" + lineIndex.ToString(), StyleIndex = styleDate };
                if (tool.LatestCalDate != null) {
                    cell7.CellValue = new CellValue(((DateTime)tool.LatestCalDate).ToOADate().ToString());
                } else {
                    cell7.CellValue = new CellValue();
                }

                Cell cell8 = new Cell() { CellReference = "H" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.CalStatus).ToString();
                cell8.CellValue = new CellValue(id);

                Cell cell9 = new Cell() { CellReference = "I" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.Comment).ToString();
                cell9.CellValue = new CellValue(id);

                Cell cell10 = new Cell() { CellReference = "J" + lineIndex.ToString(), StyleIndex = styleDate };
                if (tool.CalDue != null) {
                    cell10.CellValue = new CellValue(((DateTime)tool.CalDue).ToOADate().ToString());
                } else {
                    cell10.CellValue = new CellValue();
                }


                Cell cell11 = new Cell() { CellReference = "K" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.CalPlace).ToString();
                cell11.CellValue = new CellValue(id);

                Cell cell12 = new Cell() { CellReference = "L" + lineIndex.ToString(), DataType = CellValues.Number, StyleIndex = styleString };
                cell12.CellValue = new CellValue(tool.CalInterval.ToString());

                Cell cell13 = new Cell() { CellReference = "M" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.StoreLocation).ToString();
                cell13.CellValue = new CellValue(id);

                Cell cell14 = new Cell() { CellReference = "N" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.SystemStatus).ToString();
                cell14.CellValue = new CellValue(id);
                // todo  tool.System_status is null,  replace field to represent value
                Cell cell15 = new Cell() { CellReference = "O" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.UserStatus).ToString();
                cell15.CellValue = new CellValue(id);

                Cell cell16 = new Cell() { CellReference = "P" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.Room).ToString();
                cell16.CellValue = new CellValue(id);

                Cell cell17 = new Cell() { CellReference = "Q" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.SuperordEquip).ToString();
                cell17.CellValue = new CellValue(id);

                Cell cell18 = new Cell() { CellReference = "R" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.SortField).ToString();
                cell18.CellValue = new CellValue(id);

                Cell cell19 = new Cell() { CellReference = "S" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.Machine).ToString();
                cell19.CellValue = new CellValue(id);

                Cell cell20 = new Cell() { CellReference = "T" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(tool.ToolkitMachine).ToString();
                cell20.CellValue = new CellValue(id);

                newRow.Append(cell1);
                newRow.Append(cell2);
                newRow.Append(cell3);
                newRow.Append(cell4);
                newRow.Append(cell5);
                newRow.Append(cell6);
                newRow.Append(cell7);
                newRow.Append(cell8);
                newRow.Append(cell9);
                newRow.Append(cell10);
                newRow.Append(cell11);
                newRow.Append(cell12);
                newRow.Append(cell13);
                newRow.Append(cell14);
                newRow.Append(cell15);
                newRow.Append(cell16);
                newRow.Append(cell17);
                newRow.Append(cell18);
                newRow.Append(cell19);
                newRow.Append(cell20);

                sheetData.AppendChild<Row>(newRow);
                ++lineIndex;
            }
            Int32 count = 0;
            foreach (string key in sharedStringDic.Keys) {
                if (count >= sharedStringId) {
                    sharedStringTable.AppendChild(new SharedStringItem(new DocumentFormat.OpenXml.Spreadsheet.Text(key)));
                }
                ++count;
            }
            sharedStringTable.Save();
            ws.Save();
            wbPart.Workbook.Save();
            document.Close();

            fileinfo = new FileInfo();
            fileinfo.FileName = ""; // file name is added at client (Silverlight)
            fileinfo.Length = ms.Length;
            fileinfo.byteArray = new byte[fileinfo.Length + 10];
            Array.Copy(ms.GetBuffer(), fileinfo.byteArray, fileinfo.Length);
            //Array.Resize(ref fileinfo.FileByteStream, (int)ms.Length) ;
            //fileinfo.Length = ms.Length;
            return fileinfo;

        }
    }

    public class CreateCalInPExcelFile {

        private List<CalInProcess> filteredData;
        public CreateCalInPExcelFile() {
            filteredData = new List<CalInProcess>();
        }

        public void Add(CalInProcess ci) {
            filteredData.Add(ci);
        }


        public async Task<FileInfo>  GetExcelFile() {
            Dictionary<string, Int32> sharedStringDic = new Dictionary<string, int>();
            const string excelTemplate = "CalInProcessTemplateVer4.xlsx";
            const string sheetname = "Sheet1";
            uint styleString = 0;
            uint styleDate = 0;
            string providername = Startup.AppSettings["StorageProvider"]; 
            FileInfo fileinfo;
            Int32 sharedStringId = 0;
            UInt32 lineIndex;

            SysIO.MemoryStream ms = new SysIO.MemoryStream(); ;

            if (providername == "localfile") {
                // Response.WriteFile(AppResources.GetCalCertPath(pdffilename));  TemplateFolder
                string folder = Startup.AppSettings["PdfFoldername"];
                string filepath = SysIO.Path.Combine(folder, excelTemplate);
                //fileinfo.FileByteStream = SysIO.File.Open(filepath, SysIO.FileMode.Open);
                SysIO.FileStream fs;
                fs = SysIO.File.Open(filepath, System.IO.FileMode.Open);
                fs.CopyTo(ms);
                long bytesInStream = ms.Length;
                fs.Close();

            } else if (providername == "AzureBlob") {
                string connectionstring = Startup.AppSettings["AzureBlob"];
                CloudStorageAccount storageAccount = CloudStorageAccount.Parse(connectionstring);
                CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();
                CloudBlobContainer container = blobClient.GetContainerReference("templates");
                CloudBlockBlob blockBlob = container.GetBlockBlobReference(excelTemplate);
                //SysIO.Stream templateStream = blockBlob.OpenRead();
                //fileinfo.FileByteStream = blockBlob.OpenRead();
                SysIO.Stream frs = await blockBlob.OpenReadAsync();
                frs.CopyTo(ms);
                long bytesInStream = ms.Length;
                bool canread = ms.CanRead;
                bool canwrite = ms.CanWrite;
                frs.Close();
            }
            SpreadsheetDocument document = SpreadsheetDocument.Open(ms, true);
            WorkbookPart wbPart = document.WorkbookPart;
            Sheet theSheet = wbPart.Workbook.Descendants<Sheet>().Where(s => s.Name == sheetname).FirstOrDefault();
            if (theSheet == null) {
                throw new ArgumentException(string.Format("sheetName{0} not found", sheetname));
            }
            WorksheetPart wsPart = (WorksheetPart)(wbPart.GetPartById(theSheet.Id));
            Worksheet ws = wsPart.Worksheet;
            Columns columns = ws.Descendants<Columns>().FirstOrDefault();
            SheetData sheetData = ws.Descendants<SheetData>().FirstOrDefault();
            Row firstRow = sheetData.Descendants<Row>().ElementAt(0); // get first row , line 1
            firstRow.DyDescent = 0.3D;
            Row secondRow = sheetData.Descendants<Row>().ElementAt(1); // get second row , line 2
            foreach (Cell cel2nd in secondRow) {
                if (cel2nd != null) {
                    var cellAdd = cel2nd.CellReference;
                    if (cellAdd == "A2") styleString = cel2nd.StyleIndex.Value;
                    if (cellAdd == "H2") styleDate = cel2nd.StyleIndex.Value;
                }
            }
            secondRow.Remove();
            SharedStringTablePart sharedStringPart = wbPart.GetPartsOfType<SharedStringTablePart>().First();
            SharedStringTable sharedStringTable = sharedStringPart.SharedStringTable;
            foreach (SharedStringItem item in sharedStringTable.Elements<SharedStringItem>()) {  // read shared string and add to Dictionary
                if (item.InnerText != null) {
                    sharedStringDic.Add(item.InnerText, sharedStringId);
                    ++sharedStringId;
                }
            }

            lineIndex = 2;
            string id;
            foreach (var entry in filteredData) {

                Row newRow = new Row() { RowIndex = lineIndex, Spans = new ListValue<StringValue>() { InnerText = "1:22" }, Height = 16.5D, CustomHeight = true, DyDescent = 0.3D };
                Cell cell1 = new Cell() { CellReference = "A" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.Plant).ToString();
                cell1.CellValue = new CellValue(id);

                Cell cell2 = new Cell() { CellReference = "B" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.Location).ToString();
                cell2.CellValue = new CellValue(id);

                Cell cell3 = new Cell() { CellReference = "C" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.SerialNumber).ToString();
                cell3.CellValue = new CellValue(id);

                Cell cell4 = new Cell() { CellReference = "D" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.Material).ToString();
                cell4.CellValue = new CellValue(id);

                Cell cell5 = new Cell() { CellReference = "E" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.Description).ToString();
                cell5.CellValue = new CellValue(id);

                Cell cell6 = new Cell() { CellReference = "F" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.CalPlace).ToString();
                cell6.CellValue = new CellValue(id);

                Cell cell7 = new Cell() { CellReference = "G" + lineIndex.ToString(), DataType = CellValues.Number, StyleIndex = styleString };
                cell7.CellValue = new CellValue(entry.CalInterval.ToString());

                Cell cell8 = new Cell() { CellReference = "H" + lineIndex.ToString(), StyleIndex = styleDate };
                cell8.CellValue = ConvertDateToCellValue(entry.RegisteredDate);

                Cell cell9 = new Cell() { CellReference = "I" + lineIndex.ToString(), StyleIndex = styleDate };
                cell9.CellValue = ConvertDateToCellValue(entry.UserShipDate);

                Cell cell10 = new Cell() { CellReference = "J" + lineIndex.ToString(), StyleIndex = styleDate };
                cell10.CellValue = ConvertDateToCellValue(entry.VenReceiveDate);

                Cell cell11 = new Cell() { CellReference = "K" + lineIndex.ToString(), StyleIndex = styleDate };
                cell11.CellValue = ConvertDateToCellValue(entry.CalDate);

                Cell cell12 = new Cell() { CellReference = "L" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                string result = "";
                if (entry.CalResult == true) result = "GD";
                if (entry.CalResult == false) result = "NG";
                id = sharedStringDic.AddToSharedString(result).ToString();
                cell12.CellValue = new CellValue(id);

                Cell cell13 = new Cell() { CellReference = "M" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.VenComment).ToString();
                cell13.CellValue = new CellValue(id);

                Cell cell14 = new Cell() { CellReference = "N" + lineIndex.ToString(), StyleIndex = styleDate };
                cell14.CellValue = ConvertDateToCellValue(entry.PlanedShipDate);

                Cell cell15 = new Cell() { CellReference = "O" + lineIndex.ToString(), StyleIndex = styleDate };
                cell15.CellValue = ConvertDateToCellValue(entry.VenShipDate);

                // todo  tool.System_status is null,  replace field to represent value
                Cell cell16 = new Cell() { CellReference = "P" + lineIndex.ToString(), StyleIndex = styleDate };
                cell16.CellValue = ConvertDateToCellValue(entry.UserReceiveDate);

                Cell cell17 = new Cell() { CellReference = "Q" + lineIndex.ToString(), StyleIndex = styleDate };
                cell17.CellValue = ConvertDateToCellValue(entry.CcReceiveDate);

                Cell cell18 = new Cell() { CellReference = "R" + lineIndex.ToString(), StyleIndex = styleDate };
                cell18.CellValue = ConvertDateToCellValue(entry.CcUploadDate);

                Cell cell19 = new Cell() { CellReference = "S" + lineIndex.ToString(), DataType = CellValues.Number, StyleIndex = styleString };
                cell19.CellValue = new CellValue(entry.StdTat.ToString());

                Cell cell20 = new Cell() { CellReference = "T" + lineIndex.ToString(), DataType = CellValues.Number, StyleIndex = styleString };
                cell20.CellValue = new CellValue(entry.Tat.ToString());

                Cell cell21 = new Cell() { CellReference = "U" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.TatStatus).ToString();
                cell21.CellValue = new CellValue(id);

                Cell cell22 = new Cell() { CellReference = "V" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                string finished = "";
                if (entry.Finished == true) finished = "Done";
                id = sharedStringDic.AddToSharedString(finished).ToString();
                cell22.CellValue = new CellValue(id);

                Cell cell23 = new Cell() { CellReference = "W" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                String yearmonth;
                if (entry.UserShipDate == null) {
                    yearmonth = "";
                } else {
                    yearmonth = String.Format("{0:yyyy-MM}", (DateTime)entry.UserShipDate);
                }
                id = sharedStringDic.AddToSharedString(yearmonth).ToString();
                cell23.CellValue = new CellValue(id);

                Cell cell24 = new Cell() { CellReference = "X" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.PMaker).ToString();
                cell24.CellValue = new CellValue(id);

                Cell cell25 = new Cell() { CellReference = "Y" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.PModel).ToString();
                cell25.CellValue = new CellValue(id);

                Cell cell26 = new Cell() { CellReference = "Z" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.PName).ToString();
                cell26.CellValue = new CellValue(id);

                Cell cell27 = new Cell() { CellReference = "AA" + lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = styleString };
                id = sharedStringDic.AddToSharedString(entry.PSN).ToString();
                cell27.CellValue = new CellValue(id);

                newRow.Append(cell1);
                newRow.Append(cell2);
                newRow.Append(cell3);
                newRow.Append(cell4);
                newRow.Append(cell5);
                newRow.Append(cell6);
                newRow.Append(cell7);
                newRow.Append(cell8);
                newRow.Append(cell9);
                newRow.Append(cell10);
                newRow.Append(cell11);
                newRow.Append(cell12);
                newRow.Append(cell13);
                newRow.Append(cell14);
                newRow.Append(cell15);
                newRow.Append(cell16);
                newRow.Append(cell17);
                newRow.Append(cell18);
                newRow.Append(cell19);
                newRow.Append(cell20);
                newRow.Append(cell21);
                newRow.Append(cell22);
                newRow.Append(cell23);
                newRow.Append(cell24);
                newRow.Append(cell25);
                newRow.Append(cell26);
                newRow.Append(cell27);

                sheetData.AppendChild<Row>(newRow);
                ++lineIndex;
            }
            Int32 count = 0;
            foreach (string key in sharedStringDic.Keys) {
                if (count >= sharedStringId) {
                    sharedStringTable.AppendChild(new SharedStringItem(new DocumentFormat.OpenXml.Spreadsheet.Text(key)));
                }
                ++count;
            }
            sharedStringTable.Save();
            ws.Save();
            wbPart.Workbook.Save();
            document.Close();

            fileinfo = new FileInfo();
            fileinfo.FileName = ""; // file name is added at client (Silverlight)
            fileinfo.Length = ms.Length;
            fileinfo.byteArray = new byte[fileinfo.Length + 10];
            Array.Copy(ms.GetBuffer(), fileinfo.byteArray, fileinfo.Length);
            //Array.Resize(ref fileinfo.FileByteStream, (int)ms.Length) ;
            //fileinfo.Length = ms.Length;
            return fileinfo;

        }

        CellValue ConvertDateToCellValue(DateTime? datevalue) {
            CellValue cellvalue;
            if (datevalue != null) {
                cellvalue = new CellValue(((DateTime)datevalue).ToOADate().ToString());
            } else {
                cellvalue = new CellValue();
            }
            return cellvalue;
        }
    }
    public class FileInfo {
        public string FileName { get; set; }
        public long Length { get; set; }
        public byte[] byteArray;
        public FileInfo() { }
    }
    public class UpdateResult {
        public bool Result { get; set; }
        public string Message { get; set; }
        public UpdateResult() { }
    }


}
