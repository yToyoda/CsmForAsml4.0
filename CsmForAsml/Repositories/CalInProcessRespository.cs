using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace CsmForAsml.Models {

    /// <summary>
    /// Models.CalInProcess クラス (校正管理) をデータベースに入出力するリポジトリ
    /// </summary>
    /// <seealso cref="CalInProcess"/>
    /// <seealso cref="IReportRepository{TModel}"/>
    public class CalInProcessRepository : IRepository<CalInProcess> {

        /// <summary>
        /// CSM_Context (データベース)のインスタンス　このクラス (CalInProcessRepository)内のローカル変数
        /// </summary>
        CsmForAsml2Context _db;

        /// <summary>
        /// CalInProcessRepositoryのコンストラクタ　　CSM_Context のコンストラクタから呼ばれる            
        /// </summary>
        /// <param name="db">親クラス CSM_Context のインスタンス</param>
        public CalInProcessRepository(CsmForAsml2Context db) {
            _db = db;
        }

        /// <summary>
        /// 全ての CalInProcess を取得する
        /// </summary>
        /// <returns>全 CalInProcess</returns>
        /// <seealso cref="CalInProcess"/>
        public async Task<IEnumerable<CalInProcess>> GetAllRecordsAsync() {
            return  await _db.CalInProcess.ToListAsync();
        }

        /// <summary>
        /// 指定した条件に合致する CalInProcess (複数)を取得する
        /// </summary>
        /// <param name="predicate">条件式 通常ラムダ式で指定</param>
        /// <returns>条件に合致する CalInProcess (複数)</returns>
        /// <seealso cref="CalInProcess"/>
        public IEnumerable<CalInProcess> GetRecords(Func<CalInProcess, bool> predicate) {
            return _db.CalInProcess.Where(predicate);
        }

        /// <summary>
        /// 指定したIDに対する CalInProcess を取得する
        /// </summary>
        /// <param name="reportId">CalInProcess の Id (報告書ID)。 内部で int にキャストされる</param>
        /// <returns>指定した ID の CalInProcess</returns>
        /// <seealso cref="CalInProcess"/>
        public CalInProcess GetRecord(object reportId) {
            return _db.CalInProcess.Find((int)reportId);
        }

    
        /// <summary>
        /// データベースに CalInProcess を追加する
        /// </summary>
        /// <param name="CalInProcess">追加する CalInProcess</param>
        /// <seealso cref="CalInProcess"/>
        public void AddRecord(CalInProcess CalInProcess) {
            try {
                _db.CalInProcess.Add(CalInProcess);
                _db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException e) {
                throw new Exception("Db update concurrency exception occured at Add Record", e);
            }
            catch (DbUpdateException e)
            {
                throw new Exception("Db update exception occured at Update Record", e);
            }
        }

        /// <summary>
        /// CalInProcess に変更があれば、データベースを更新する
        /// </summary>
        /// <param name="CalInProcess">更新する CalInProcess</param>
        /// <seealso cref="CalInProcess"/>
        public void UpdateRecord(CalInProcess CalInProcess) {
            try {
                _db.Entry(CalInProcess).State = EntityState.Modified;
                _db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException e) {
                throw new Exception("Db update concurrency exception occured  at Update Record", e);
            }
            catch (DbUpdateException e)
            {
                throw new Exception("Db update exception occured at Update Record", e);
            }
        }

        /// <summary>
        /// CalInProcess を削除する
        /// </summary>
        /// <param name="id">削除する CalInProcess の ID (報告書ID)</param>        
        /// <seealso cref="CalInProcess"/>
        public void RemoveRecord(object id) {
            try {
                CalInProcess tgt = _db.CalInProcess.Find(id);
                _db.CalInProcess.Remove(tgt);
                _db.SaveChanges();
            }
            catch (DbUpdateException e) {
                throw new Exception("Db update exception occured at Remove Record", e);
            }
        }

        public CalInProcess GetLatestRecords(Func<CalInProcess, bool> predicate) {
            var all = _db.CalInProcess.Where(predicate);
            CalInProcess latest = null;
            foreach (var x in all) {
                if (latest == null || x.RegisteredDate > latest.RegisteredDate) {
                    latest = x;
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