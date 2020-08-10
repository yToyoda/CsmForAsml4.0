using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace CsmForAsml.Models {

    /// <summary>
    /// Models.CalInProcessBU クラス (校正管理) を CalInProcessBackup データベースに入出力するリポジトリ
    /// </summary>
    /// <seealso cref="CalInProcess"/>
    /// <seealso cref="IReportRepository{TModel}"/>
    public class CalInProcessBURepository : IRepository<CalInProcessBU> {

        /// <summary>
        /// _db (データベース)のインスタンス　このクラス (CalInProcessBURepository)内のローカル変数
        /// </summary>    
        CsmForAsml2Context _db;

        /// <summary>
        /// CalInProcess BURepositoryのコンストラクタ　　CSM_Context のコンストラクタから呼ばれる            
        /// </summary>
        /// <param name="db">親クラス CSM_Context のインスタンス</param>
        public CalInProcessBURepository(CsmForAsml2Context db) {
            _db = db;
        }

        /// <summary>
        /// CalInProcessBackup 内の全ての CalInProcess を取得する
        /// </summary>
        /// <returns>全 CalInProcess</returns>
        /// <seealso cref="CalInProcess"/>
        public async Task<IEnumerable<CalInProcessBU>> GetAllRecordsAsync() {
            return await _db.CalInProcessBackup.ToListAsync();
        }

        /// <summary>
        /// CalInProcessBackup から指定した条件に合致する CalInProcess (複数)を取得する
        /// </summary>
        /// <param name="predicate">条件式 通常ラムダ式で指定</param>
        /// <returns>条件に合致する CalInProcess (複数)</returns>
        /// <seealso cref="CalInProcess"/>
        public IEnumerable<CalInProcessBU> GetRecords(Func<CalInProcessBU, bool> predicate) {
            return _db.CalInProcessBackup.Where(predicate);
        }

        /// <summary>
        /// CalInProcessBackup から 指定したIDに対する CalInProcess を取得する
        /// </summary>
        /// <param name="reportId">CalInProcess の Id (int を object にキャストしたもの) </param>
        /// <returns>指定した ID の CalInProcess</returns>
        /// <seealso cref="CalInProcess"/>
        public CalInProcessBU GetRecord(object reportId) {
            return _db.CalInProcessBackup.Find(reportId);
        }


        /// <summary>
        /// CalInProcessBackup データベースに CalInProcess を追加する
        /// </summary>
        /// <param name="CalInProcess">追加する CalInProcess</param>
        /// <seealso cref="CalInProcess"/>
        public void AddRecord(CalInProcessBU CalInProcess) {
            try {
                _db.CalInProcessBackup.Add(CalInProcess);
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
        public void UpdateRecord(CalInProcessBU CalInProcess) {
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
        /// CalInProcessBackup データベースから 指定の ID の CalInProcess を削除する
        /// </summary>
        /// <param name="id">削除する CalInProcess の ID </param>        
        /// <seealso cref="CalInProcess"/>
        public void RemoveRecord(object id) {
            try {
                CalInProcessBU tgt = _db.CalInProcessBackup.Find(id);
                _db.CalInProcessBackup.Remove(tgt);
                _db.SaveChanges();
            }
            catch (DbUpdateException e) {
                throw new Exception("Db update exception occured at Remove Record", e);
            }
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