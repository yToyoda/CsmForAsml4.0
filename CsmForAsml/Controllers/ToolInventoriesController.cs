using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.IO;
using SysIO = System.IO;
using Microsoft.AspNetCore.SignalR;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using CsmForAsml.Models;
using CsmForAsml.Hubs;
using CsmForAsml.Tools;
using Microsoft.CodeAnalysis.Operations;

namespace CsmForAsml.Controllers {
    public class ToolInventoriesController : Controller {
        private readonly CsmForAsml2Context _context;
        private readonly ToolInventoryRepository _toolRepo;
        private readonly IHubContext<CsmHub> _hubContext;
        private readonly ICreateExcelFile<ToolInventory> _crExcel;

        public ToolInventoriesController(CsmForAsml2Context context, 
                                         IHubContext<CsmHub> hubcontext, 
                                         ICreateExcelFile<ToolInventory> crExcel) {
            _context = context;
            _toolRepo = context.ToolInventoryRepository;
            _hubContext = hubcontext;
            _crExcel = crExcel;
        }

        // GET: ToolInventories
        public async Task<IActionResult> Index() {
            return View(await _context.ToolInventory.ToListAsync());
        }

        // GET: ToolInventories/Details/5
        public async Task<IActionResult> Details(string id) {
            if (id == null) {
                return NotFound();
            }

            var toolInventory = await _context.ToolInventory
                .FirstOrDefaultAsync(m => m.SerialNumber == id);
            if (toolInventory == null) {
                return NotFound();
            }

            return View(toolInventory);
        }

        // GET: ToolInventories/Create
        public IActionResult Create() {
            return View();
        }

        // POST: ToolInventories/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("SerialNumber,Plant,StoreLocation,Material,Description,LatestCalDate,CalStatus,Comment,CalDue,SystemStatus,UserStatus,Room,SuperordEquip,SortField,Machine,ToolkitMachine,ToolkitSloc,LatestSafetyDate,SafetyDue,NeedCal,NeedSafety,RemovedDate,UpdatedDate,InCal,PSN")] ToolInventory toolInventory) {
            if (ModelState.IsValid) {
                _context.Add(toolInventory);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(toolInventory);
        }

        // GET: ToolInventories/Edit/5
        public async Task<IActionResult> Edit(string id) {
            if (id == null) {
                return NotFound();
            }

            var toolInventory = await _context.ToolInventory.FindAsync(id);
            if (toolInventory == null) {
                return NotFound();
            }
            return View(toolInventory);
        }

        // POST: ToolInventories/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(string id, [Bind("SerialNumber,Plant,StoreLocation,Material,Description,LatestCalDate,CalStatus,Comment,CalDue,SystemStatus,UserStatus,Room,SuperordEquip,SortField,Machine,ToolkitMachine,ToolkitSloc,LatestSafetyDate,SafetyDue,NeedCal,NeedSafety,RemovedDate,UpdatedDate,InCal,PSN")] ToolInventory toolInventory) {
            if (id != toolInventory.SerialNumber) {
                return NotFound();
            }

            if (ModelState.IsValid) {
                try {
                    _context.Update(toolInventory);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException) {
                    if (!ToolInventoryExists(toolInventory.SerialNumber)) {
                        return NotFound();
                    } else {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }
            return View(toolInventory);
        }

        // GET: ToolInventories/Delete/5
        public async Task<IActionResult> Delete(string id) {
            if (id == null) {
                return NotFound();
            }

            var toolInventory = await _context.ToolInventory
                .FirstOrDefaultAsync(m => m.SerialNumber == id);
            if (toolInventory == null) {
                return NotFound();
            }

            return View(toolInventory);
        }

        // POST: ToolInventories/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(string id) {
            var toolInventory = await _context.ToolInventory.FindAsync(id);
            _context.ToolInventory.Remove(toolInventory);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool ToolInventoryExists(string id) {
            return _context.ToolInventory.Any(e => e.SerialNumber == id);
        }

        [HttpGet]
        public async Task<IActionResult> GetData() {
            var inventories = await _toolRepo.GetAllRecordsAsync();
            List<ToolInventory> ans = new List<ToolInventory>();
            await GetNotMappedFieldsToolInv(inventories, ans);
            var serializeOptions = new JsonSerializerOptions {
                //                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNamingPolicy = null,
                WriteIndented = true
            };
            serializeOptions.Converters.Add(new DateTimeConverter());
            return Json(ans, serializeOptions);
        }

        /// <summary>
        /// クライアント側で、Move TO InCAL のキーが押された時に起動される処理ルーチン
        /// [HttpPost]
        /// </summary>
        /// <param name="serialNumList">InCal に登録する SerialNumber のリスト</param>
        /// <returns>Default の View()</returns>
        /// //  public ActionResult MoveToIncal(SerialNumList serialNumList)
        /// // public ActionResult MoveToIncal( [Bind("serialNumbers")] string[] serialNumbers) {
        /// //　[ValidateAntiForgeryToken]


        [HttpPost]
        public ActionResult MoveToIncal([FromBody] SerialNumList serial) {
            
            var x = serial.ToString();

            return Json(serial.ToString());
        }

        [HttpPost]
        public async Task< ActionResult> Download([FromBody] SerialNumList serial) {

    

            string clientId = serial.connectionId;
            HttpContext.Session.SetString("ExcelFilename", "");

            var allToolInv = await _toolRepo.GetAllRecordsAsync();

            var tools = from e in allToolInv
                       join n in serial.SerialNums
                       on e.SerialNumber equals n
                       select e;

            List<ToolInventory> ans = new List<ToolInventory>();
            await GetNotMappedFieldsToolInv(tools, ans);

            //var createExcel = new CreateToolInventoryExcel();
            MemoryStream ms = await _crExcel.GetExcelStream(ans);
            string filename = "ToolInventory_" + AppResources.JSTNow.ToString("yyyyMMdd-hhmmss") + ".xlsx";

            if (Startup.AppSettings["StorageProvider"] == "localfile") {

                string folder = Startup.AppSettings["PdfFoldername"];
                string filepath = SysIO.Path.Combine(folder, filename);
                using (FileStream file = new FileStream(filepath, FileMode.Create, System.IO.FileAccess.Write)) {
                    file.Write(ms.ToArray(), 0, (int)ms.Length);
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
            // notify to client by SignalR
            if (! String.IsNullOrEmpty (clientId )) {
                await _hubContext.Clients.Client(clientId).SendAsync("ExcelFinished", filename);
            } else {
                throw new Exception("Connection ID is empty");
            }
            return new EmptyResult();
            //string kind = "application/octet-stream";
            //return File(ms.ToArray(), kind, filename);
        }

        private async Task GetNotMappedFieldsToolInv(IEnumerable<ToolInventory> tools, List<ToolInventory> ans) {

            var locations = await _context.LocationRepository.GetAllRecordsAsync();
            var materials = await _context.MaterialNeedCalRepository.GetAllRecordsAsync();

            var res = from i in tools
                      join m in materials on i.Material equals m.Material
                      join loc in locations on i.Plant equals loc.Plant
                      select new { Inv = i, Mat = m , Loc = loc};

            foreach (var r in res) {
                r.Inv.CalPlace = r.Mat.CalPlace;
                r.Inv.CalInterval = r.Mat.CalInterval;
                r.Inv.SafetyInterval = r.Mat.SafetyInterval;
                r.Inv.Location = r.Loc.Location1;
                ans.Add(r.Inv);
            }
        }


        [HttpGet]
        public ActionResult ShowPdf() {
            // has not modified
            string filename = HttpContext.Session.GetString("PdfFilename");
            MemoryStream fs = new MemoryStream();
            // _blobFileIO.DownloadToStream(_containerName, _pdffolder, filename, fs);
            fs.Seek(0, SeekOrigin.Begin);
            var kind = System.Net.Mime.MediaTypeNames.Application.Pdf;
            HttpContext.Session.SetString("PdfFilename", "");
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

    }

    /// <summary>
    /// SerialNumber のリスト ブラウザからサーバに選択されている機器を通知するために使用
    /// </summary>
    public class SerialNumList {
        /// <summary>
        /// 管理番号のリスト
        /// </summary>
        public List<string> SerialNums { get; set; }
        public string connectionId { get; set; }
    }
}
