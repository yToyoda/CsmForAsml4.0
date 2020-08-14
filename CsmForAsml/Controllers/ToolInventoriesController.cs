using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CsmForAsml.Models;
using Microsoft.AspNetCore.Http;

namespace CsmForAsml.Controllers
{
    public class ToolInventoriesController : Controller
    {
        private readonly CsmForAsml2Context _context;
        private ToolInventoryRepository _toolRepo;

        public ToolInventoriesController(CsmForAsml2Context context)
        {
            _context = context;
            _toolRepo = context.ToolInventoryRepository;
        }

        // GET: ToolInventories
        public async Task<IActionResult> Index()
        {
            return View(await _context.ToolInventory.ToListAsync());
        }

        // GET: ToolInventories/Details/5
        public async Task<IActionResult> Details(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var toolInventory = await _context.ToolInventory
                .FirstOrDefaultAsync(m => m.SerialNumber == id);
            if (toolInventory == null)
            {
                return NotFound();
            }

            return View(toolInventory);
        }

        // GET: ToolInventories/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: ToolInventories/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("SerialNumber,Plant,StoreLocation,Material,Description,LatestCalDate,CalStatus,Comment,CalDue,SystemStatus,UserStatus,Room,SuperordEquip,SortField,Machine,ToolkitMachine,ToolkitSloc,LatestSafetyDate,SafetyDue,NeedCal,NeedSafety,RemovedDate,UpdatedDate,InCal,PSN")] ToolInventory toolInventory)
        {
            if (ModelState.IsValid)
            {
                _context.Add(toolInventory);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(toolInventory);
        }

        // GET: ToolInventories/Edit/5
        public async Task<IActionResult> Edit(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var toolInventory = await _context.ToolInventory.FindAsync(id);
            if (toolInventory == null)
            {
                return NotFound();
            }
            return View(toolInventory);
        }

        // POST: ToolInventories/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(string id, [Bind("SerialNumber,Plant,StoreLocation,Material,Description,LatestCalDate,CalStatus,Comment,CalDue,SystemStatus,UserStatus,Room,SuperordEquip,SortField,Machine,ToolkitMachine,ToolkitSloc,LatestSafetyDate,SafetyDue,NeedCal,NeedSafety,RemovedDate,UpdatedDate,InCal,PSN")] ToolInventory toolInventory)
        {
            if (id != toolInventory.SerialNumber)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(toolInventory);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!ToolInventoryExists(toolInventory.SerialNumber))
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
            return View(toolInventory);
        }

        // GET: ToolInventories/Delete/5
        public async Task<IActionResult> Delete(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var toolInventory = await _context.ToolInventory
                .FirstOrDefaultAsync(m => m.SerialNumber == id);
            if (toolInventory == null)
            {
                return NotFound();
            }

            return View(toolInventory);
        }

        // POST: ToolInventories/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(string id)
        {
            var toolInventory = await _context.ToolInventory.FindAsync(id);
            _context.ToolInventory.Remove(toolInventory);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool ToolInventoryExists(string id)
        {
            return _context.ToolInventory.Any(e => e.SerialNumber == id);
        }

        [HttpGet]
        public async Task<IActionResult> GetData() {

            var _materiapRepo = _context.MaterialNeedCalRepository;
            var materials = await _materiapRepo.GetAllRecordsAsync();

            var inventories = await _toolRepo.GetAllRecordsAsync();

            var res = from i in inventories
                      join m in materials 
                        on i.Material equals m.Material
                      select new { Inv = i, Mat = m };

            List<ToolInventory> ans = new List<ToolInventory>();
            foreach (var r in res) {
                r.Inv.CalPlace = r.Mat.CalPlace;
                r.Inv.CalInterval = r.Mat.CalInterval;
                r.Inv.SafetyInterval = r.Mat.SafetyInterval;
                ans.Add(r.Inv);
            }

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
        [HttpPost]
        public ActionResult MoveToIncal(SerialNumList serialNumList) {
            HttpContext.Session.SetString("pdffile", "");
            
            foreach (var equipNo in serialNumList.SerialNumbers) {

                
            }
            
           return View();
        }
    }
}
