using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using CsmForAsml.Models;

namespace CsmForAsml.Controllers
{
    public class MaterialNeedCalsController : Controller
    {
        private readonly CsmForAsml2Context _context;

        public MaterialNeedCalsController(CsmForAsml2Context context)
        {
            _context = context;
        }

        // GET: MaterialNeedCals
        public async Task<IActionResult> Index()
        {
            MaterialNeedCalRepository _mncRep = _context.MaterialNeedCalRepository;
            IEnumerable<MaterialNeedCal> list = await _mncRep.GetAllRecordsAsync();
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
        public ActionResult GetData() {
            var equipments = _equipmentRepo.GetAllRecords();
            List<EquipmentDispModel> equip = new List<EquipmentDispModel>();
            CopyEq(equipments, equip);

            return Json(equip, JsonRequestBehavior.AllowGet);
        }
        /// <summary>
        /// CSM_Context の Equipmentのリストを、　EquipmentDispModelのリストに変換する
        /// </summary>
        /// <param name="equips">IEnumerable &lt;Equipment&gt; 型のEquipment の情報 (ソース) </param>
        /// <param name="equipt">変換された List &lt;EquipmentDispModel&gt; 型のEquipment の情報 (デスティネーション) </param>
        private void CopyEq(IEnumerable<Equipment> equips, List<EquipmentDispModel> equipt) {
            DateTime today = DateTime.Now.Date;
            DateTime firstNM = App_Utility.FirstDayOfNMonth(today, 1);
            DateTime first2M = App_Utility.FirstDayOfNMonth(today, 2);
            bool inCal = false;

            foreach (var eqs in equips) {
                EquipmentDispModel eqt = new EquipmentDispModel();
                eqt.EquipNo = eqs.EquipNo;
                eqt.User_Department = eqs.User_Department ?? "";
                eqt.User_Location1 = eqs.User_Location1 ?? "";
                eqt.User_Location2 = eqs.User_Location2 ?? "";
                eqt.User_Individual = eqs.User_Individual ?? "";
                eqt.User_Administrator = eqs.User_Administrator ?? "";

                eqt.Manufacturer = eqs.Manufacturer ?? "";
                eqt.ModelNumber = eqs.ModelNumber ?? "";
                eqt.ProductName = eqs.ProductName ?? "";
                eqt.Serial = eqs.Serial ?? "";
                eqt.InitialRegistoredDate = ToShortDate(eqs.InitialRegistoredDate);
                eqt.Status = eqs.Status ?? "";
                eqt.StatusChangeDate = ToShortDate(eqs.StatusChangeDate);
                eqt.CalInterval = eqs.CalInterval?.ToString() ?? "";
                eqt.LatestCalDate = ToShortDate(eqs.LatestCalDate);
                eqt.CalResult = eqs.CalResult ?? "";
                eqt.CalDueStatus = "";

                if (eqt.Status.Contains("校正対象")) {

                    eqt.CalDue = ToShortDate(eqs.CalDue);
                    if (eqs.CalDue == null) {
                        eqt.CalDueStatus = "NO CalDue";
                    } else {
                        inCal = (eqs.StopUsingDate != null);
                        if (inCal) {
                            eqt.CalDueStatus = "In Cal";
                        } else if (eqs.CalDue < today) {
                            eqt.CalDueStatus = "OverDue";
                        } else if (eqs.CalDue >= today && eqs.CalDue < firstNM) {
                            eqt.CalDueStatus = "Due-TM";
                        } else if (eqs.CalDue < first2M) {
                            eqt.CalDueStatus = "Due-NM";
                        }
                    }
                } else {
                    eqt.CalDue = "";
                }
                eqt.StopUsingDate = ToShortDate(eqs.StopUsingDate);
                eqt.Notes = eqs.Notes ?? "";
                eqt.RelatedCustomer = eqs.RelatedCustomer ?? "";
                eqt.UseForYakki = (eqs.UseForYakki == null) ? "" : eqs.UseForYakki.Value.ToString();
                eqt.StopStatus = eqs.StopStatus ?? "";
                eqt.User_Memo = eqs.User_Memo ?? "";
                equipt.Add(eqt);
            }
        }

        private string ToShortDate(DateTime? date) {
            return (date == null) ? "" : date.Value.ToShortDateString();
        }

    }
}
