using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CsmForAsml.Models;
using CsmForAsml.Tools;
using Microsoft.AspNetCore.Routing.Constraints;
using Microsoft.VisualBasic;
using Microsoft.AspNetCore.Http;
using System.Net;
using Microsoft.AspNetCore.SignalR;
using CsmForAsml.Hubs;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using SysIO = System.IO;
using System.IO;
using Microsoft.Extensions.Logging;
using System.Reflection;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.AspNetCore.Authorization;

namespace CsmForAsml.Controllers {
    [Authorize]
    public class CalInProcessesController : Controller {
        private readonly ILogger<CalInProcessesController> _logger;
        private readonly CsmForAsml2Context _context;
        //private readonly CalInProcessRepository _calInProRepo;
        private readonly IHubContext<CsmHub> _hubContext;
        private Dictionary<DateTime, string> _holidayDic; 

        [TempData] string ExcelFilename { get; set; }
        public CalInProcessesController(ILogger<CalInProcessesController> logger, 
                                        CsmForAsml2Context context, IHubContext<CsmHub> hubContext) {
            _logger = logger;
            _context = context;
            //_calInProRepo = context.CalInProcessRepository;
            _hubContext = hubContext;
        }
      

        // GET: CalInProcesses
        public async Task<IActionResult> Index() {
            _logger.LogInformation("CalInProcesses - Index");
            return View(await _context.CalInProcess.ToListAsync());
        }
                
        public Dictionary<DateTime, string> HolidayDic {
            get {
                if (_holidayDic == null) {
                    _holidayDic = new Dictionary<DateTime, string>();
                    var holidays = _context.Holidays.ToList();
                    foreach (var holiday in holidays) {
                        _holidayDic.Add(holiday.Date, holiday.HolidayName);
                    }
                }
                return _holidayDic;
            }
        }



        private bool CalInProcessExists(int id) {
            return _context.CalInProcess.Any(e => e.Id == id);
        }

        /// <summary>
        /// Json で表した 全 Entry  の情報をクライアント側に返す
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public async Task<IActionResult> GetData() {
            //var cals = await _calInProRepo.GetAllRecordsAsync();
            var cals = await _context.CalInProcess.ToListAsync();
            List<CalInProcess> ans = new List<CalInProcess>();
            await GetNotMappedFields(cals, ans);
            var serializeOptions = new JsonSerializerOptions {
                //                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNamingPolicy = null,
                WriteIndented = true
            };
            serializeOptions.Converters.Add(new DateTimeConverter());
            return Json(ans, serializeOptions);
        }

        private async Task GetNotMappedFields(IEnumerable<CalInProcess> cals, List<CalInProcess> ans) {

            var locations = await _context.LocationRepository.GetAllRecordsAsync();
            var materials = await _context.MaterialNeedCalRepository.GetAllRecordsAsync();
            var inventories = await _context.ToolInventoryRepository.GetAllRecordsAsync();

            var res = from calinp in cals
                      join inv in inventories on calinp.SerialNumber equals inv.SerialNumber
                      join mat in materials on inv.Material equals mat.Material
                      join loc in locations on inv.Plant equals loc.Plant
                      orderby calinp.Id ascending
                      select new { Cal = calinp, Inv = inv, Mat = mat, Loc = loc };

            foreach (var r in res) {
                r.Cal.CalResultString = "";
                if (r.Cal.CalResult == true) {
                    r.Cal.CalResultString = "GD";
                } else if (r.Cal.CalResult == false) {
                    r.Cal.CalResultString = "NG";
                }
                r.Cal.Material = r.Inv.Material;
                r.Cal.Description = r.Mat.MaterialDescription;
                r.Cal.CalPlace = r.Mat.CalPlace;

                r.Cal.CalInterval = r.Mat.CalInterval;
                r.Cal.PMaker = r.Mat.PMaker;
                r.Cal.PModel = r.Mat.PModel;
                r.Cal.PName = r.Mat.PName;
                r.Cal.PSN = r.Inv.PSN;
                r.Cal.PriceToUser = r.Mat.PriceToUser;
                r.Cal.PriceFromVendor = r.Mat.PriceFromVendor;
                r.Cal.Plant = r.Inv.Plant;
                r.Cal.Location = r.Loc.Location1;
                ans.Add(r.Cal);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Download([FromBody] IdNumList idlist) {
            // download excel file
            _logger.LogInformation("CalInProcesses - Download To Excel");

            string clientId = idlist.connectionId;
            HttpContext.Session.SetString("ExcelFilename", "");

            var allCalInP = await _context.CalInProcess.ToListAsync();

            var cals = from e in allCalInP
                       join n in idlist.IdNums
                       on e.Id equals n
                       select e;

            List<CalInProcess> ans = new List<CalInProcess>();
            await GetNotMappedFields(cals, ans);

            var createExcel = new CreateCalInProcessExcel();
            MemoryStream ms = await createExcel.GetExcelStream(ans);
            string filename = "CalInProcess_" + AppResources.JSTNow.ToString("yyyyMMdd-hhmmss") + ".xlsx";

            if (Startup.AppSettings["StorageProvider"] == "localfile") {
                FileInfoClass fi = new FileInfoClass();
                fi.byteArray = ms.ToArray();
                fi.Length = ms.Length;

                string folder = Startup.AppSettings["PdfFoldername"];
                string filepath = SysIO.Path.Combine(folder, filename);
                using (FileStream file = new FileStream(filepath, FileMode.Create, System.IO.FileAccess.Write)) {
                    file.Write(fi.byteArray, 0, (int)fi.Length);
                    file.Close();
                }
            } else {
                string connectionstring = Startup.AppSettings["AzureBlob"];
                CloudStorageAccount storageAccount = CloudStorageAccount.Parse(connectionstring);
                CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();
                CloudBlobContainer container = blobClient.GetContainerReference("temp2");
                string user = HttpContext.User.Identity.Name;
                if ((user ?? "") == "") user = "Yutaka";
                CloudBlockBlob blockBlob = container.GetBlockBlobReference(user + "/" + filename);
                await blockBlob.UploadFromStreamAsync(ms);
            }
            var serializeOptions = new JsonSerializerOptions {
                PropertyNamingPolicy = null,
                WriteIndented = true
            };

            return Json(filename, serializeOptions);
        }


        [HttpGet]
        public async Task<ActionResult> ShowExcel(string Filename) {
            string kind = "application/octet-stream";
            MemoryStream ms = new MemoryStream();
            if (Startup.AppSettings["StorageProvider"] == "localfile") {
                string folder = Startup.AppSettings["PdfFoldername"];
                string filepath = System.IO.Path.Combine(folder, Filename);
                using (FileStream file = new FileStream(filepath, FileMode.Open, System.IO.FileAccess.Read)) {
                    file.CopyTo(ms);
                    file.Close();
                }
                // delete the file
                System.IO.File.Delete(filepath);
            } else {
                string connectionstring = Startup.AppSettings["AzureBlob"];
                CloudStorageAccount storageAccount = CloudStorageAccount.Parse(connectionstring);
                CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();
                CloudBlobContainer container = blobClient.GetContainerReference("temp2");
                string user = HttpContext.User.Identity.Name;
                if ((user ?? "") == "") user = "Yutaka";
                CloudBlockBlob blockBlob = container.GetBlockBlobReference(user + "/" + Filename);
                await blockBlob.DownloadToStreamAsync(ms);
                await blockBlob.DeleteIfExistsAsync();
            }
            return File(ms.ToArray(), kind, Filename);
        }

        [HttpPost]
        public async Task<ActionResult> SaveChanges([FromBody] Updates Updates) {
            _logger.LogInformation("CalInProcesses - Save Changes");
            MaterialNeedCalRepository mrep = _context.MaterialNeedCalRepository;
            UpdateResultList resultList =  new UpdateResultList();
            foreach (var UpdateData in Updates.UpdateList) {
                UpdateResult result = new UpdateResult();
                DateTime eventDate = DateTime.MinValue;
                int Id = UpdateData.Id;
                result.Id = Id;
                int stage = UpdateData.StageNum;
                result.StageNum = stage;

                bool res = (UpdateData.EventDate != null) && DateTime.TryParse(UpdateData.EventDate, out eventDate);
                if (res) {
                    //var entry = _context.CalInProcess.FirstOrDefault(Id);
                    var entry = _context.CalInProcess.Find(Id);
                    switch (stage) {
                        case 1:  //ASML 発送日
                            entry.UserShipDate = eventDate;
                            break;
                        case 2:  // Vendor 受領日
                            entry.VenReceiveDate = eventDate;
                            // calculate return date and send back
                            var matentry = mrep.GetRecord(entry.Material);
                            var StdTAT = matentry.Std_TAT;
                            if (StdTAT != null) {
                                DateTime PlanedShipDate = AppResources.DateAfterNWorkDays(HolidayDic, (DateTime)entry.VenReceiveDate, (int)StdTAT);
                                entry.PlanedShipDate = PlanedShipDate;
                                // client に変更を通知
                                result.OptionalDate = PlanedShipDate.ToShortDateString();
                            }

                            break;
                        case 3:  // 校正日
                            entry.CalDate = eventDate;
                            if (UpdateData.CalResult != null) entry.CalResult = UpdateData.CalResult;
                            if (!string.IsNullOrWhiteSpace(UpdateData.Comment)) entry.VenComment = UpdateData.Comment;
                            break;
                        case 4:     //予定出荷日
                            break;
                        case 5:   // Vendor 発送日
                            entry.VenShipDate = eventDate;
                            break;
                        case 6:   // asml 受領日
                            entry.UserReceiveDate = eventDate;
                            break;
                        case 7:  //  CC 受領日
                            entry.CcReceiveDate = eventDate;
                            break;
                        case 8:  // CC登録日
                            break;
                        default:
                            break;
                    }
                    _context.Update(entry);
                    _context.SaveChanges();
                    result.Status = "OK";
                } else {
                    result.Status = "DateFormatError";
                }
                resultList.ResultList.Add(result);
            }

            var serializeOptions = new JsonSerializerOptions {
                PropertyNamingPolicy = null,
                WriteIndented = true
            };

            return Json(resultList, serializeOptions);
        }

        [HttpPost]
        public async Task<ActionResult> SavePInfo([FromBody] PInfo PInfoData) {
            _logger.LogInformation("CalInProcesses - Save P.Info");
            string clientId = PInfoData.connectionId;
            if (PInfoData.ChangedP) {

                //MaterialNeedCalRepository matrep = _context.MaterialNeedCalRepository;
                //var materialEntry = matrep.GetRecord(PInfoData.Material);
                MaterialNeedCal materialEntry = _context.MaterialNeedCal.Find(PInfoData.Material);
                if (materialEntry != null) {
                    materialEntry.PMaker = PInfoData.PMaker;
                    materialEntry.PModel = PInfoData.PModel;
                    materialEntry.PName = PInfoData.PName;
                    _context.Update(materialEntry);
                    _context.SaveChanges();
                }
            }
            if (PInfoData.ChangedS) {
                //ToolInventoryRepository toolrep = _context.ToolInventoryRepository;
                //ToolInventory toolInvEntry = toolrep.GetRecord(PInfoData.Serial);
                ToolInventory toolInvEntry = _context.ToolInventory.Find(PInfoData.Serial);
                toolInvEntry.PSN = PInfoData.PSerial;
                //toolrep.UpdateRecord(toolInvEntry);
                _context.Update(toolInvEntry);
                _context.SaveChanges();
            }
            await _hubContext.Clients.Client(clientId).SendAsync("PInfoSaved");
            return new EmptyResult();
        }

    }

    public class IdNumList {
        public string connectionId { get; set; }
        public List<int> IdNums { get; set; }
    }

    public class PInfo {
        public string connectionId { get; set; }
        public int Id { get; set; }
        public string Serial { get; set; }
        public string Material { get; set; }
        public string PMaker { get; set; }
        public string PModel { get; set; }
        public string PName { get; set; }
        public string PSerial { get; set; }
        public bool ChangedP { get; set; }
        public bool ChangedS { get; set; }
    }

    public class EventUpdate {
        public int Id { get; set; }
        public int StageNum { get; set; }
        public string EventDate { get; set; }
        public bool? CalResult { get; set; }
        public string Comment { get; set; }
    }

    public class Updates {
      public List<EventUpdate> UpdateList { get; set; }
    }
    public class UpdateResult {
        public UpdateResult() {
            Id = 0;
            Status = "";
            OptionalDate = "";
        }
        public int Id { get; set; }
        public int StageNum { get; set; }
        public string Status { get; set; }
        public string OptionalDate { get; set; }
    }

    public class UpdateResultList {
        public UpdateResultList() {
            ResultList = new List<UpdateResult>();
        }
        public List<UpdateResult> ResultList { get; set; }
    }


}
