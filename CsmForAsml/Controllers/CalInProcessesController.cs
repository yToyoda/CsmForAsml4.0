using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using System.IO;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CsmForAsml.Models;
using CsmForAsml.Tools;
using Microsoft.AspNetCore.Routing.Constraints;
using Microsoft.VisualBasic;
using Microsoft.AspNetCore.Http;
using System.Net;

namespace CsmForAsml.Controllers
{
    public class CalInProcessesController : Controller {
        private readonly CsmForAsml2Context _context;
        private readonly CalInProcessRepository _calInProRepo;

        [TempData] string ExcelFilename { get; set; }
        public CalInProcessesController(CsmForAsml2Context context) {
            _context = context;
            _calInProRepo = context.CalInProcessRepository;
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
            var _materiapRepo = _context.MaterialNeedCalRepository;
            var _inventoryRepo = _context.ToolInventoryRepository;
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

            HttpContext.Session.SetString("ExcelFilename", "");

            var allCalInP = await _calInProRepo.GetAllRecordsAsync();

            var cals = from e in allCalInP
                       join n in idlist.IdNums
                       on e.Id equals n
                       select e;

            List<CalInProcess> ans = new List<CalInProcess>();
            await GetNotMappedFields(cals, ans);

            var createExcel = new CreateExcelFile();
            FileInfoClass fi = await createExcel.GetCalInProcessExcelFileStream(ans);


            string filename = "CalInProcess_" + AppResources.JSTNow.ToString("yyyyMMdd-hhmmss") + ".xlsx";
            //            excelFile.FileName = filename;
            string folder = Startup.AppSettings["PdfFoldername"];
            string filepath = System.IO.Path.Combine(folder, filename);
            using (FileStream file = new FileStream(filepath, FileMode.Create, System.IO.FileAccess.Write)) {
                file.Write(fi.byteArray, 0, (int)fi.Length);
                file.Close();
            }
            //HttpContext.Session.SetString("ExcelFilename", filename);
            //ExcelFilename = filename;
            //folder =  @"C:\Temp";

            

            return new EmptyResult();

            byte[] buff = new byte[30000];
            int len;
            using (FileStream file = new FileStream(filepath, FileMode.Open, System.IO.FileAccess.Read)) {
                len = file.Read(buff);
                file.Close();
            }
            string kind = "application/vnd.ms-excel";
            //return File(ms.ToArray(), kind, filename);
            return File(buff, kind, filename);

        }

        [HttpGet]
        public ActionResult GetStatus() {
            WorkStatus ws = new WorkStatus();
            ws.Status = "working";
            ws.Filename = "CalInProcess.xlsx";

            //string pdffname = HttpContext.Session.GetString("PdfFilename");
            //string excelfname = HttpContext.Session.GetString("ExcelFileName");




            if (ws.Filename != "") {
                ws.Status = "ExcelFinished";
                //ws.Filename = excelfname;
            }
            return Json(ws);
        }

        [HttpGet]
        public ActionResult ShowPdf() {

            string filename = HttpContext.Session.GetString("PdfFilename");
            MemoryStream fs = new MemoryStream();
            // _blobFileIO.DownloadToStream(_containerName, _pdffolder, filename, fs);
            fs.Seek(0, SeekOrigin.Begin);
            var kind = System.Net.Mime.MediaTypeNames.Application.Pdf;
            HttpContext.Session.SetString("PdfFilename","");
            return File(fs.ToArray(), kind, filename);
        }

        [HttpGet]
        public ActionResult ShowExcel() {
            //string filename = HttpContext.Session.GetString("ExcelFileName");
            //HttpContext.Session.SetString("ExcelFileName", "");
            string filename = "CIP.xlsx";
            //MemoryStream ms = new MemoryStream();
            //_blobFileIO.DownloadToStream(_containerName, _excelfolder, filename, ms);
            //ms.Seek(0, SeekOrigin.Begin);
            string kind = "application/octet-stream";

            string folder = @"C:\Temp";
            string filepath = System.IO.Path.Combine(folder, filename);
            MemoryStream ms = new MemoryStream();

            using (FileStream file = new FileStream(filepath, FileMode.Open, System.IO.FileAccess.Read)) {
                file.CopyTo(ms);
                file.Close();
            }

            return File(ms.ToArray(), kind, filename);
            // return File(ms, kind, filename);
        }

    }

    public class IdNumList {
        public List<int> IdNums { get; set; }
    }
}
