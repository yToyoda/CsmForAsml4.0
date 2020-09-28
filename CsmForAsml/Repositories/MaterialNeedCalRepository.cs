using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace CsmForAsml.Models
{

    /// <summary>
    /// Models.MaterialNeedCal クラス (校正管理) をデータベースに入出力するリポジトリ
    /// </summary>
    /// <seealso cref="MaterialNeedCal"/>
    /// <seealso cref="IReportRepository{TModel}"/>
    public class MaterialNeedCalRepository : IRepository<MaterialNeedCal>
    {

        /// <summary>
        /// CSM_Context (データベース)のインスタンス　このクラス (MaterialNeedCalRepository)内のローカル変数
        /// </summary>
        CsmForAsml2Context _db;

        /// <summary>
        /// MaterialNeedCalRepositoryのコンストラクタ　　CSM_Context のコンストラクタから呼ばれる            
        /// </summary>
        /// <param name="db">親クラス CSM_Context のインスタンス</param>
        public MaterialNeedCalRepository(CsmForAsml2Context db)
        {
            _db = db;
        }

        /// <summary>
        /// 全ての MaterialNeedCal を取得する
        /// </summary>
        /// <returns>全 MaterialNeedCal</returns>
        /// <seealso cref="MaterialNeedCal"/>
        public async Task<IEnumerable<MaterialNeedCal>> GetAllRecordsAsync()
        {
            return await _db.MaterialNeedCal.ToListAsync();
        }

        /// <summary>
        /// 指定した条件に合致する MaterialNeedCal (複数)を取得する
        /// </summary>
        /// <param name="predicate">条件式 通常ラムダ式で指定</param>
        /// <returns>条件に合致する MaterialNeedCal (複数)</returns>
        /// <seealso cref="MaterialNeedCal"/>
        public IEnumerable<MaterialNeedCal> GetRecords(Func<MaterialNeedCal, bool> predicate)
        {
            return _db.MaterialNeedCal.Where(predicate);
        }

        /// <summary>
        /// 指定したIDに対する MaterialNeedCal を取得する
        /// </summary>
        /// <param name="Material">MaterialNeedCal の Key である Material(string) </param>
        /// <returns>MaterialNeedCal</returns>
        /// <seealso cref="MaterialNeedCal"/>
        public MaterialNeedCal GetRecord(object Material)
        {
            return _db.MaterialNeedCal.Find(Material);
        }


        /// <summary>
        /// データベースに MaterialNeedCal を追加する
        /// </summary>
        /// <param name="MaterialNeedCal">追加する MaterialNeedCal</param>
        /// <seealso cref="MaterialNeedCal"/>
        public void AddRecord(MaterialNeedCal MaterialNeedCal)
        {
            try
            {
                _db.MaterialNeedCal.Add(MaterialNeedCal);
                _db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException e)
            {
                throw new Exception("Db update concurrency exception occured at Add Record", e);
            }
            catch (DbUpdateException e)
            {
                throw new Exception("Db update exception occured at Update Record", e);
            }
        }

        /// <summary>
        /// MaterialNeedCal に変更があれば、データベースを更新する
        /// </summary>
        /// <param name="MaterialNeedCal">更新する MaterialNeedCal</param>
        /// <seealso cref="MaterialNeedCal"/>
        public void UpdateRecord(MaterialNeedCal MaterialNeedCal)
        {
            try
            {
                _db.Entry(MaterialNeedCal).State = EntityState.Modified;
                _db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException e)
            {
                throw new Exception("Db update concurrency exception occured  at Update Record", e);
            }
            catch (DbUpdateException e)
            {
                throw new Exception("Db update exception occured at Update Record", e);
            }
        }

        /// <summary>
        /// MaterialNeedCal を削除する
        /// </summary>
        /// <param name="id">削除する MaterialNeedCal の ID (報告書ID)</param>        
        /// <seealso cref="MaterialNeedCal"/>
        public void RemoveRecord(object id)
        {
            try
            {
                MaterialNeedCal tgt = _db.MaterialNeedCal.Find(id);
                _db.MaterialNeedCal.Remove(tgt);
                _db.SaveChanges();
            }
            catch (DbUpdateException e)
            {
                throw new Exception("Db update exception occured at Remove Record", e);
            }
        }

        /// <summary>
        /// 使用しているリソースを廃棄する
        /// </summary>
        public void Dispose()
        {
            this.Dispose(true);
        }

        /// <summary>
        /// リソース CSM_Context を廃棄 (Dispose) する
        /// </summary>
        /// <param name="disposing">true の時にアンマネージリソースを廃棄する</param>
        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                if (_db != null) _db.Dispose();
            }
        }
    }

}
