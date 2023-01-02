using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CsmForAsml.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace CsmForAsml.Controllers 
{ 
[Authorize]
    public class HolidaysController : Controller
    {
        private readonly ILogger<HolidaysController> _logger;
        private readonly CsmForAsml2Context _context;

        public HolidaysController(ILogger<HolidaysController> logger, CsmForAsml2Context context)
        {
            _logger = logger;
            _context = context;
        }

        // GET: Holidays
        public async Task<IActionResult> Index()
        {
            _logger.LogInformation("Holidays - Index");
            return View(await _context.Holidays.ToListAsync());
        }

        // GET: Holidays/Details/5
        public async Task<IActionResult> Details(DateTime? id)
        {
            if (id == null)
            {
                return NotFound();
            }
            DateTime iddate = (DateTime)id;
            var holidayEntry = await _context.Holidays
                .FirstOrDefaultAsync(m => m.Date.Date == iddate.Date);
            if (holidayEntry == null)
            {
                return NotFound();
            }

            return View(holidayEntry);
        }

        // GET: Holidays/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: Holidays/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Date,HolidayName")] HolidayEntry holidayEntry)
        {
            if (ModelState.IsValid)
            {
                holidayEntry.Date = holidayEntry.Date.Date;
                _context.Add(holidayEntry);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(holidayEntry);
        }

        // GET: Holidays/Edit/5
        public async Task<IActionResult> Edit(DateTime? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var holidayEntry = await _context.Holidays.FindAsync(id);
            if (holidayEntry == null)
            {
                return NotFound();
            }
            return View(holidayEntry);
        }

        // POST: Holidays/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(DateTime id, [Bind("Date,HolidayName")] HolidayEntry holidayEntry)
        {
            if (id != holidayEntry.Date.Date)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    var holidayEntryDB = await _context.Holidays.FindAsync(id);
                    if (holidayEntryDB != null) {
                        copyHoliday(holidayEntry, ref holidayEntryDB);
                        _context.Update(holidayEntryDB);
                        await _context.SaveChangesAsync();
                    }
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!HolidayEntryExists(holidayEntry.Date))
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
            return View(holidayEntry);
        }

        // GET: Holidays/Delete/5
        public async Task<IActionResult> Delete(DateTime? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var holidayEntry = await _context.Holidays
                .FirstOrDefaultAsync(m => m.Date.Date == id);
            if (holidayEntry == null)
            {
                return NotFound();
            }

            return View(holidayEntry);
        }

        // POST: Holidays/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(DateTime id)
        {
            var holidayEntry = await _context.Holidays.FirstOrDefaultAsync(m => m.Date.Date == id.Date );
            _context.Holidays.Remove(holidayEntry);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool HolidayEntryExists(DateTime id)
        {
            return _context.Holidays.Any(e => e.Date.Date == id);
        }

        private void copyHoliday(HolidayEntry holidayFrom, ref HolidayEntry  holidayTo) {
            //holidayTo.Date = holidayFrom.Date;
            holidayTo.HolidayName = holidayFrom.HolidayName;
        }
    }
}
