using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CsmForAsml.Models;

using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace CsmForAsml.Controllers
{
    public class MaterialNeedCalsController : Controller
    {
        private readonly CsmForAsml2Context _context;
        private readonly MaterialNeedCalRepository _mncRepo;

        public MaterialNeedCalsController(CsmForAsml2Context context)
        {
            _context = context;
            _mncRepo = context.MaterialNeedCalRepository;
        }

        // GET: MaterialNeedCals
        public async Task<IActionResult> Index()
        {
            //MaterialNeedCalRepository _mncRep = _context.MaterialNeedCalRepository;
            IEnumerable<MaterialNeedCal> list = await _mncRepo.GetAllRecordsAsync();
            /*
            List<Tat> TatList = _context.Tat.ToList();
            foreach (MaterialNeedCal mncal in list) {
                var tate = TatList.Find(x => x.Material.Contains(mncal.Material));
                if (tate != null) {
                    mncal.PriceToUser = tate.PriceToUser;
                    mncal.PriceFromVendor = tate.PriceFromVendor;
                    _mncRep.UpdateRecord(mncal);
                }
            }
            */
            return View(list);
        }

        // GET: MaterialNeedCals/Details/5
        public async Task<IActionResult> Details(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var materialNeedCal = await _context.MaterialNeedCal
                .FirstOrDefaultAsync(m => m.Material == id);
            if (materialNeedCal == null)
            {
                return NotFound();
            }

            return View(materialNeedCal);
        }

        // GET: MaterialNeedCals/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: MaterialNeedCals/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Material,MaterialDescription,CalPlace,CalVendor,CalInterval,Instruction,AddRemove,ChangeDate,NeedCal,NeedSafety,SafetyInterval,PMaker,PName,PModel")] MaterialNeedCal materialNeedCal)
        {
            if (ModelState.IsValid)
            {
                _context.Add(materialNeedCal);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(materialNeedCal);
        }

        // GET: MaterialNeedCals/Edit/5
        public async Task<IActionResult> Edit(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var materialNeedCal = await _context.MaterialNeedCal.FindAsync(id);
            if (materialNeedCal == null)
            {
                return NotFound();
            }
            return View(materialNeedCal);
        }

        // POST: MaterialNeedCals/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(string id, [Bind("Material,MaterialDescription,CalPlace,CalVendor,CalInterval,Instruction,AddRemove,ChangeDate,NeedCal,NeedSafety,SafetyInterval,PMaker,PName,PModel")] MaterialNeedCal materialNeedCal)
        {
            if (id != materialNeedCal.Material)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(materialNeedCal);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!MaterialNeedCalExists(materialNeedCal.Material))
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
            return View(materialNeedCal);
        }

        // GET: MaterialNeedCals/Delete/5
        public async Task<IActionResult> Delete(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var materialNeedCal = await _context.MaterialNeedCal
                .FirstOrDefaultAsync(m => m.Material == id);
            if (materialNeedCal == null)
            {
                return NotFound();
            }

            return View(materialNeedCal);
        }

        // POST: MaterialNeedCals/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(string id)
        {
            var materialNeedCal = await _context.MaterialNeedCal.FindAsync(id);
            _context.MaterialNeedCal.Remove(materialNeedCal);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool MaterialNeedCalExists(string id)
        {
            return _context.MaterialNeedCal.Any(e => e.Material == id);
        }

        /// <summary>
        /// Json で表した 全Equipments の情報をクライアント側に返す
        /// </summary>
        /// <returns>Json フォーマットでシリアライズされた全Equipment の情報</returns>
        [HttpGet]
        public async Task<IActionResult> GetData() {
            var equipments = await _mncRepo.GetAllRecordsAsync();
            
            CopyEq(equipments);

            var settings = new JsonSerializerSettings {
                ContractResolver = new CamelCasePropertyNamesContractResolver(),
            };
            var jsonData = JsonConvert.SerializeObject(equipments, settings);

            return Json(jsonData);
        }
        /// <summary>
        /// CSM_Context の Equipmentのリストを、　EquipmentDispModelのリストに変換する
        /// </summary>
        /// <param name="equips">IEnumerable &lt;Equipment&gt; 型のEquipment の情報 (ソース) </param>
        /// <param name="equipt">変換された List &lt;EquipmentDispModel&gt; 型のEquipment の情報 (デスティネーション) </param>
        private void CopyEq(IEnumerable<MaterialNeedCal> equips) {

            foreach (var eqs in equips) {

                eqs.NeedCal = eqs.NeedCal ?? false;
                eqs.NeedSafety = eqs.NeedSafety ?? false;
                // eqs.ChangeDate = ToShortDate(eqs.ChangeDate);
            }

        }

        private string ToShortDate(DateTime? date) {
            return (date == null) ? "" : date.Value.ToShortDateString();
        }

    }
}
