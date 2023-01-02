using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text.Json.Serialization;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CsmForAsml.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System.Globalization;

namespace CsmForAsml.Controllers
{
    [Authorize]
    public class MaterialNeedCalsController : Controller
    {
        private readonly ILogger<MaterialNeedCalsController> _logger;
        private readonly CsmForAsml2Context _context;
        private readonly MaterialNeedCalRepository _mncRepo;

        public MaterialNeedCalsController(ILogger<MaterialNeedCalsController> logger, 
                                                CsmForAsml2Context context)
        {
            _logger = logger;
            _context = context;
            _mncRepo = context.MaterialNeedCalRepository;
            CultureInfo.CurrentUICulture = new CultureInfo("ja-JP", false);
        }

        // GET: MaterialNeedCals
        public async Task<IActionResult> Index()
        {
            //MaterialNeedCalRepository _mncRep = _context.MaterialNeedCalRepository;
            CultureInfo.CurrentUICulture = new CultureInfo("ja-JP", false);
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
            _logger.LogInformation("Material Need Cal - Index");
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

            if (ModelState.IsValid)
            {
                try
                {
                    var materialNeedCalDB = await _context.MaterialNeedCal.FindAsync(id);
                    if (materialNeedCalDB == null || materialNeedCalDB.Material != id) {
                        // Can not Edit Field "Material"
                        return NotFound();
                    }

                    copyMaterial(materialNeedCal, ref materialNeedCalDB);
                    _context.Update(materialNeedCalDB);
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
          
            var serializeOptions = new JsonSerializerOptions {
//                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNamingPolicy = null,
                WriteIndented = true
            };
            serializeOptions.Converters.Add(new DateTimeConverter());

            return Json(equipments, serializeOptions);
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

        public ActionResult SavePInfo([FromBody] MProdInfo PInfoData) {
            MaterialNeedCalRepository matrep = _context.MaterialNeedCalRepository;
            MaterialNeedCal entry = matrep.GetRecord(PInfoData.Material);
            entry.PMaker = PInfoData.PMaker;
            entry.PModel = PInfoData.PModel;
            entry.PName = PInfoData.PName;
            matrep.UpdateRecord(entry);
            return Json("Ok");
        }

        private void copyMaterial(MaterialNeedCal mncFrom, ref MaterialNeedCal mncTo) {
            mncTo.MaterialDescription = mncFrom.MaterialDescription; ;
            mncTo.CalPlace= mncFrom.CalPlace;
            mncTo.CalVendor= mncFrom.CalVendor;
            mncTo.CalInterval = mncFrom.CalInterval;
            mncTo.Instruction = mncFrom.Instruction;
            mncTo.AddRemove = mncFrom.AddRemove;
            mncTo.ChangeDate= mncFrom.ChangeDate;
            mncTo.NeedCal= mncFrom.NeedCal;
            mncTo.NeedSafety = mncFrom.NeedSafety;
            mncTo.SafetyInterval = mncFrom.SafetyInterval;
            mncTo.PMaker= mncFrom.PMaker;
            mncTo.PName= mncFrom.PName;
            mncTo.PModel= mncFrom.PModel;
            mncTo.PriceFromVendor= mncFrom.PriceFromVendor;
            mncTo.PriceToUser= mncFrom.PriceToUser;
            mncTo.Std_TAT= mncFrom.Std_TAT;
            mncTo.ChangeDate= mncFrom.ChangeDate;                        
        }

    }

    public class MProdInfo {
        public string Material { get; set; }
        public string PMaker { get; set; }
        public string PModel { get; set; }
        public string PName { get; set; }

        /*
                Material: currentRow.Material,
                PMaker: currentRow.PMaker,
                PModel: currentRow.PModel,
                PName: currentRow.PName,
        */
    }
}
