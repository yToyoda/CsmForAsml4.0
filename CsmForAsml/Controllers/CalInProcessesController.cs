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
using System.Reflection;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace CsmForAsml.Controllers
{
    public class CalInProcessesController : Controller {
        private readonly CsmForAsml2Context _context;
        private readonly CalInProcessRepository _calInProRepo;
        private readonly IHubContext<CsmHub> _hubContext;

        [TempData] string ExcelFilename { get; set; }
        public CalInProcessesController(CsmForAsml2Context context, IHubContext<CsmHub> hubContext) {
            _context = context;
            _calInProRepo = context.CalInProcessRepository;
            _hubContext = hubContext;
        }

        // GET: CalInProcesses
        public async Task<IActionResult> Index() {
            return View(await _context.CalInProcess.ToListAsync());
        }

        // GET: CalInProcesses/Details/5
        public async Task<IActionResult> Details(int? id) {
            if (id == null) {
                return NotFound();
            }

            var calInProcess = await _context.CalInProcess
                .FirstOrDefaultAsync(m => m.Id == id);
            if (calInProcess == null) {
                return NotFound();
            }

            return View(calInProcess);
        }

        // GET: CalInProcesses/Create
        public IActionResult Create() {
            return View();
        }

        // POST: CalInProcesses/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Id,SerialNumber,RegisteredDate,UserShipDate,VenReceiveDate,CalDate,CalResult,VenComment,PlanedShipDate,VenShipDate,UserReceiveDate,CcReceiveDate,CcUploadDate,Tat,Finished,Plant,StdTat,TatStatus")] CalInProcess calInProcess) {
            if (ModelState.IsValid) {
                _context.Add(calInProcess);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(calInProcess);
        }

        // GET: CalInProcesses/Edit/5
        public async Task<IActionResult> Edit(int? id) {
            if (id == null) {
                return NotFound();
            }

            var calInProcess = await _context.CalInProcess.FindAsync(id);
            if (calInProcess == null) {
                return NotFound();
            }
            return View(calInProcess);
        }

        // POST: CalInProcesses/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,SerialNumber,RegisteredDate,UserShipDate,VenReceiveDate,CalDate,CalResult,VenComment,PlanedShipDate,VenShipDate,UserReceiveDate,CcReceiveDate,CcUploadDate,Tat,Finished,Plant,StdTat,TatStatus")] CalInProcess calInProcess) {
            if (id != calInProcess.Id) {
                return NotFound();
            }

            if (ModelState.IsValid) {
                try {
                    _context.Update(calInProcess);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException) {
                    if (!CalInProcessExists(calInProcess.Id)) {
                        return NotFound();
                    } else {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }
            return View(calInProcess);
        }

        // GET: CalInProcesses/Delete/5
        public async Task<IActionResult> Delete(int? id) {
            if (id == null) {
                return NotFound();
            }

            var calInProcess = await _context.CalInProcess
                .FirstOrDefaultAsync(m => m.Id == id);
            if (calInProcess == null) {
                return NotFound();
            }

            return View(calInProcess);
        }

        // POST: CalInProcesses/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id) {
            var calInProcess = await _context.CalInProcess.FindAsync(id);
            _context.CalInProcess.Remove(calInProcess);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
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
            var cals = await _calInProRepo.GetAllRecordsAsync();
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

            string clientId = idlist.connectionId;
            HttpContext.Session.SetString("ExcelFilename", "");

            var allCalInP = await _calInProRepo.GetAllRecordsAsync();

            var cals = from e in allCalInP
                       join n in idlist.IdNums
                       on e.Id equals n
                       select e;

            List<CalInProcess> ans = new List<CalInProcess>();
            await GetNotMappedFields(cals, ans);

            var createExcel = new CreateCalInProcessExcel();
            MemoryStream ms  = await createExcel.GetExcelStream(ans);           
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
        public ActionResult ShowPdf() {
            // has not modified
            string filename = HttpContext.Session.GetString("PdfFilename");
            MemoryStream fs = new MemoryStream();
            // _blobFileIO.DownloadToStream(_containerName, _pdffolder, filename, fs);
            fs.Seek(0, SeekOrigin.Begin);
            var kind = System.Net.Mime.MediaTypeNames.Application.Pdf;
            HttpContext.Session.SetString("PdfFilename","");
            return File(fs.ToArray(), kind, filename);
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
        public async Task<ActionResult> SavePInfo ([FromBody] PInfo PInfoData) {          
            string clientId = PInfoData.connectionId;
            if (PInfoData.ChangedP) {
                MaterialNeedCalRepository matrep = _context.MaterialNeedCalRepository;
                var materialEntry =  matrep.GetRecord(PInfoData.Material);
                materialEntry.PMaker = PInfoData.PMaker;
                materialEntry.PModel = PInfoData.PModel;
                materialEntry.PName = PInfoData.PName;
                matrep.UpdateRecord(materialEntry);
            }
            if (PInfoData.ChangedS) {
                ToolInventoryRepository toolrep = _context.ToolInventoryRepository;
                ToolInventory toolInvEntry = toolrep.GetRecord(PInfoData.Serial);
                toolInvEntry.PSN = PInfoData.PSerial;
                toolrep.UpdateRecord(toolInvEntry);
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

}
