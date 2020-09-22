using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CsmForAsml.Models;
using CsmForAsml.Tools;

namespace CsmForAsml.Controllers
{
    public class CalHistoryController : Controller
    {
        private readonly CsmForAsml2Context _context;

        public CalHistoryController(CsmForAsml2Context context)
        {
            _context = context;
        }

        // GET: CalHistory
        public async Task<IActionResult> Index()
        {
            return View(await _context.CalDate.ToListAsync());
        }
        public IActionResult History(string Serial) {
            string ser = "J0251";
            ViewData["Serial"] = ser;
            string prefix = Startup.AppSettings["AzureUrlPrefix"];
            string container = Startup.AppSettings["CalCertContainer"];
            var history = _context.CalDateRepository.GetRecords(r => r.Serial == ser);
            foreach (var entry in history) {
                entry.KindOfCal = "";
                if (entry.IsCal == true) { entry.KindOfCal = "CAL"; }
                else if (entry.IsCal == false ) { entry.KindOfCal = "Safety"; }
                string filename = entry.PdfFileName;
                if (!String.IsNullOrWhiteSpace(filename)) {
                    string folder = AppResources.GetCalCertFolder(filename);
                   entry.urlToFile = $"{prefix}{container}/{folder}/{filename}";
                }
            }
            return View(history);
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

        // GET: CalHistory/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: CalHistory/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Id,Serial,CalDate1,CalStatus,PdfFileName,Comment,IsCal")] CalDate calDate)
        {
            if (ModelState.IsValid)
            {
                _context.Add(calDate);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(calDate);
        }

        // GET: CalHistory/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var calDate = await _context.CalDate.FindAsync(id);
            if (calDate == null)
            {
                return NotFound();
            }
            return View(calDate);
        }

        // POST: CalHistory/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Serial,CalDate1,CalStatus,PdfFileName,Comment,IsCal")] CalDate calDate)
        {
            if (id != calDate.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(calDate);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!CalDateExists(calDate.Id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }
            return View(calDate);
        }

        // GET: CalHistory/Delete/5
        public async Task<IActionResult> Delete(int? id)
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

        // POST: CalHistory/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
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
