using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CsmForAsml.Models;

namespace CsmForAsml.Controllers
{
    public class CalInProcessesController : Controller
    {
        private readonly CsmForAsml2Context _context;
        private readonly CalInProcessRepository _calInProRepo;

        public CalInProcessesController(CsmForAsml2Context context)
        {
            _context = context;
            _calInProRepo = context.CalInProcessRepository;
        }

        // GET: CalInProcesses
        public async Task<IActionResult> Index()
        {
            return View(await _context.CalInProcess.ToListAsync());
        }

        // GET: CalInProcesses/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var calInProcess = await _context.CalInProcess
                .FirstOrDefaultAsync(m => m.Id == id);
            if (calInProcess == null)
            {
                return NotFound();
            }

            return View(calInProcess);
        }

        // GET: CalInProcesses/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: CalInProcesses/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Id,SerialNumber,RegisteredDate,UserShipDate,VenReceiveDate,CalDate,CalResult,VenComment,PlanedShipDate,VenShipDate,UserReceiveDate,CcReceiveDate,CcUploadDate,Tat,Finished,Plant,StdTat,TatStatus")] CalInProcess calInProcess)
        {
            if (ModelState.IsValid)
            {
                _context.Add(calInProcess);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(calInProcess);
        }

        // GET: CalInProcesses/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var calInProcess = await _context.CalInProcess.FindAsync(id);
            if (calInProcess == null)
            {
                return NotFound();
            }
            return View(calInProcess);
        }

        // POST: CalInProcesses/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,SerialNumber,RegisteredDate,UserShipDate,VenReceiveDate,CalDate,CalResult,VenComment,PlanedShipDate,VenShipDate,UserReceiveDate,CcReceiveDate,CcUploadDate,Tat,Finished,Plant,StdTat,TatStatus")] CalInProcess calInProcess)
        {
            if (id != calInProcess.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(calInProcess);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!CalInProcessExists(calInProcess.Id))
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
            return View(calInProcess);
        }

        // GET: CalInProcesses/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var calInProcess = await _context.CalInProcess
                .FirstOrDefaultAsync(m => m.Id == id);
            if (calInProcess == null)
            {
                return NotFound();
            }

            return View(calInProcess);
        }

        // POST: CalInProcesses/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var calInProcess = await _context.CalInProcess.FindAsync(id);
            _context.CalInProcess.Remove(calInProcess);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }



        private bool CalInProcessExists(int id)
        {
            return _context.CalInProcess.Any(e => e.Id == id);
        }

        /// <summary>
        /// Json で表した 全 Entry  の情報をクライアント側に返す
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public async Task<IActionResult> GetData() {
            var cals = await _calInProRepo.GetAllRecordsAsync();

            var serializeOptions = new JsonSerializerOptions {
                //                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNamingPolicy = null,                
                WriteIndented = true
            };
            serializeOptions.Converters.Add(new DateTimeConverter());

            return Json(cals, serializeOptions);
        }

        
    }
}
