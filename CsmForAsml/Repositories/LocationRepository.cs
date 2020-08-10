using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace CsmForAsml.Models
{
    public class LocationRepository : IRepository<Location>
    {
        /// <summary>
        /// CSM_Context (データベース)のインスタンス　このクラス (LocationRepository)内のローカル変数
        /// </summary>
        CsmForAsml2Context _db;

        /// <summary>
        /// LocationRepositoryのコンストラクタ　　CSM_Context のコンストラクタから呼ばれる            
        /// </summary>
        /// <param name="db">親クラス CSM_Context のインスタンス</param>
        public LocationRepository(CsmForAsml2Context db)
        {
            _db = db;
        }

        /// <summary>
        /// 全ての Location を取得する
        /// </summary>
        /// <returns>全 Location</returns>
        /// <seealso cref="Location"/>
        public async Task<IEnumerable<Location>> GetAllRecordsAsync()
        {
            return await _db.Location.ToListAsync();
        }

        /// <summary>
        /// 指定した条件に合致する Location (複数)を取得する
        /// </summary>
        /// <param name="predicate">条件式 通常ラムダ式で指定</param>
        /// <returns>条件に合致する Location (複数)</returns>
        /// <seealso cref="Location"/>
        public IEnumerable<Location> GetRecords(Func<Location, bool> predicate)
        {
            return _db.Location.Where(predicate);
        }

        /// <summary>
        /// 指定したIDに対する Location を取得する
        /// </summary>
        /// <param name="id">Location のid (日付)。 </param>
        /// <returns>指定した ID の Location</returns>
        /// <seealso cref="Location"/>
        public Location GetRecord(object id)
        {
            return _db.Location.Find(id);
        }


        /// <summary>
        /// データベースに Location を追加する
        /// </summary>
        /// <param name="Location">追加する Location</param>
        /// <seealso cref="Location"/>
        public void AddRecord(Location Location)
        {
            try
            {
                _db.Location.Add(Location);
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
        /// Location に変更があれば、データベースを更新する
        /// </summary>
        /// <param name="Location">更新する Location</param>
        /// <seealso cref="Location"/>
        public void UpdateRecord(Location Location)
        {
            try
            {
                _db.Entry(Location).State = EntityState.Modified;
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
        /// Location を削除する
        /// </summary>
        /// <param name="id">削除する Location の ID </param>        
        /// <seealso cref="Location"/>
        public void RemoveRecord(object id)
        {
            try
            {
                Location tgt = _db.Location.Find(id);
                _db.Location.Remove(tgt);
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
