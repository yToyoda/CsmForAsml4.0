using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using SysIO = System.IO;

using CsmForAsml.Models;
using CsmForAsml.Tools;
using CsmForAsml.Hubs;
using System.IO;

namespace CsmForAsml.Controllers
{
    public class CalHistoryController : Controller
    {
        private readonly CsmForAsml2Context _context;
        private readonly IHubContext<CsmHub> _hubContext;

        public CalHistoryController(CsmForAsml2Context context, IHubContext<CsmHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // GET: CalHistory
        public async Task<IActionResult> Index()
        {
            return View(await _context.CalDate.ToListAsync());
        }
        public async Task<IActionResult> History(string id ) {
            string ser = id;
            //string ser = "J0251";
            ViewData["Serial"] = ser;
            string prefix = Startup.AppSettings["AzureUrlPrefix"];
            string container = Startup.AppSettings["CalCertContainer"];
            var history = _context.CalDateRepository.GetRecords(r => r.Serial == ser);
            foreach (var entry in history) {
                entry.KindOfCal = "";
                if (entry.IsCal == true) { entry.KindOfCal = "Cal"; }
                else if (entry.IsCal == false ) { entry.KindOfCal = "Safety"; }
                string filename = entry.PdfFileName;
                if (!string.IsNullOrWhiteSpace(filename)) {
                    string folder = AppResources.GetCalCertFolder(filename);
                   entry.urlToFile = $"{prefix}{container}/{folder}/{filename}";
                } else {
                    entry.PdfFileName = "";
                }
            }
            //await _hubContext.Clients.Client(ConId).SendAsync("HistoryFinished");
            return View(history);
        }

        public async Task<IActionResult> LatestCalCert(string id, string ConId) {
            string ser = id;
            var e = _context.CalDateRepository.GetRecords(r => r.Serial == ser).FirstOrDefault();
            string filename = e.PdfFileName ?? "";

            await _hubContext.Clients.Client(ConId).SendAsync("LatestCalCert",filename);

            return new EmptyResult();

        }



        public async Task<IActionResult> ShowPdf(string id) {
            string filename = id;
            string connectionstring = Startup.AppSettings["AzureBlob"];
            string containerName = Startup.AppSettings["CalCertContainer"];
            string folder = AppResources.GetCalCertFolder(filename);
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(connectionstring);
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();
            CloudBlobContainer container = blobClient.GetContainerReference(containerName);
            CloudBlockBlob blockBlob = container.GetBlockBlobReference(folder+@"/"+filename);
            MemoryStream ms = new MemoryStream();
            await blockBlob.DownloadToStreamAsync(ms);
            string ty = "application/pdf";
            //return File(ms.ToArray(),ty,filename);
            return File(ms.ToArray(), ty);
        }

        // GET: CalHistory/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var calDate = await _context.CalDate
                .FirstOrDefaultAsync(m => m.Id == id);
            if (calDate == null)
            {
                return NotFound();
            }

            return View(calDate);
        }

        // GET: CalHistory/Delete/5
        public async Task<IActionResult> Delete(int? id) {
            if (id == null) {
                return NotFound();
            }

            var calDate = await _context.CalDate
                .FirstOrDefaultAsync(m => m.Id == id);
            if (calDate == null) {
                return NotFound();
            }

            return View(calDate);
        }

        // POST: CalHistory/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id) {
            var calDate = await _context.CalDate.FindAsync(id);
            _context.CalDate.Remove(calDate);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }



        private bool CalDateExists(int id)
        {
            return _context.CalDate.Any(e => e.Id == id);
        }
    }
}
