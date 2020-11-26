using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CsmForAsml.Models;
using Microsoft.AspNetCore.Authorization;

namespace CsmForAsml.Controllers 
{ 
[Authorize]
    public class HolidaysController : Controller
    {
        private readonly CsmForAsml2Context _context;

        public HolidaysController(CsmForAsml2Context context)
        {
            _context = context;
        }

        // GET: Holidays
        public async Task<IActionResult> Index()
        {
            return View(await _context.Holidays.ToListAsync());
        }

        // GET: Holidays/Details/5
        public async Task<IActionResult> Details(DateTime? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var holidayEntry = await _context.Holidays
                .FirstOrDefaultAsync(m => m.Date == id);
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
            if (id != holidayEntry.Date)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(holidayEntry);
                    await _context.SaveChangesAsync();
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
                .FirstOrDefaultAsync(m => m.Date == id);
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
            var holidayEntry = await _context.Holidays.FindAsync(id);
            _context.Holidays.Remove(holidayEntry);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool HolidayEntryExists(DateTime id)
        {
            return _context.Holidays.Any(e => e.Date == id);
        }
    }
}
