using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace CsmForAsml.Models
{
    public class CalDateRepository : IRepository<CalDate> {
        /// <summary>
        /// CSM_Context (データベース)のインスタンス　このクラス (CalDateRepository)内のローカル変数
        /// </summary>
        CsmForAsml2Context _db;

        /// <summary>
        /// CalDateRepositoryのコンストラクタ　　CSM_Context のコンストラクタから呼ばれる            
        /// </summary>
        /// <param name="db">親クラス CSM_Context のインスタンス</param>
        public CalDateRepository(CsmForAsml2Context db) {
            _db = db;
        }

        /// <summary>
        /// 全ての CalDate を取得する
        /// </summary>
        /// <returns>全 CalDate</returns>
        /// <seealso cref="CalDate"/>
        public async Task<IEnumerable<CalDate>> GetAllRecordsAsync() {
            return await _db.CalDate.ToListAsync();
        }

        /// <summary>
        /// 指定した条件に合致する CalDate (複数)を取得する
        /// </summary>
        /// <param name="predicate">条件式 通常ラムダ式で指定</param>
        /// <returns>条件に合致する CalDate (複数)</returns>
        /// <seealso cref="CalDate"/>
        public IEnumerable<CalDate> GetRecords(Func<CalDate, bool> predicate) {
            var rec= _db.CalDate.Where(predicate).OrderByDescending(cd => cd.CalDate1);            
            return rec;
        }

        /// <summary>
        /// 指定したIDに対する CalDate を取得する
        /// </summary>
        /// <param name="reportId">CalDate の Id (報告書ID)。 内部で int にキャストされる</param>
        /// <returns>指定した ID の CalDate</returns>
        /// <seealso cref="CalDate"/>
        public CalDate GetRecord(object reportId) {
            return _db.CalDate.Find((int)reportId);
        }


        /// <summary>
        /// データベースに CalDate を追加する
        /// </summary>
        /// <param name="CalDate">追加する CalDate</param>
        /// <seealso cref="CalDate"/>
        public void AddRecord(CalDate CalDate) {
            try {
                _db.CalDate.Add(CalDate);
                _db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException e) {
                throw new Exception("Db update concurrency exception occured at Add Record", e);
            }
            catch (DbUpdateException e) {
                throw new Exception("Db update exception occured at Update Record", e);
            }
        }

        /// <summary>
        /// CalDate に変更があれば、データベースを更新する
        /// </summary>
        /// <param name="CalDate">更新する CalDate</param>
        /// <seealso cref="CalDate"/>
        public void UpdateRecord(CalDate CalDate) {
            try {
                _db.Entry(CalDate).State = EntityState.Modified;
                _db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException e) {
                throw new Exception("Db update concurrency exception occured  at Update Record", e);
            }
            catch (DbUpdateException e) {
                throw new Exception("Db update exception occured at Update Record", e);
            }
        }

        /// <summary>
        /// CalDate を削除する
        /// </summary>
        /// <param name="id">削除する CalDate の ID (報告書ID)</param>        
        /// <seealso cref="CalDate"/>
        public void RemoveRecord(object id) {
            try {
                CalDate tgt = _db.CalDate.Find(id);
                _db.CalDate.Remove(tgt);
                _db.SaveChanges();
            }
            catch (DbUpdateException e) {
                throw new Exception("Db update exception occured at Remove Record", e);
            }
        }

        public DateTime? GetLatestCalDate(string serialnumber) {
            var all = _db.CalDate.Where(ent => (ent.Serial == serialnumber && ent.IsCal == true));
            DateTime? latest = null;
            foreach (var x in all) {
                if (latest == null || x.CalDate1 > latest) {
                    latest = x.CalDate1;
                }
            }
            return latest;
        }
    

        /// <summary>
        /// 使用しているリソースを廃棄する
        /// </summary>
        public void Dispose() {
            this.Dispose(true);
        }

        /// <summary>
        /// リソース CSM_Context を廃棄 (Dispose) する
        /// </summary>
        /// <param name="disposing">true の時にアンマネージリソースを廃棄する</param>
        protected virtual void Dispose(bool disposing) {
            if (disposing) {
                if (_db != null) _db.Dispose();
            }
        }
    }   
}

