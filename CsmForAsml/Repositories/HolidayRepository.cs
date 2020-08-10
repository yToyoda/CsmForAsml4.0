using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace CsmForAsml.Models
{
    public class HolidayRepository  : IRepository<HolidayEntry>
    {
        /// <summary>
        /// CSM_Context (データベース)のインスタンス　このクラス (HolidayRepository)内のローカル変数
        /// </summary>
        CsmForAsml2Context _db;

        /// <summary>
        /// HolidayRepositoryのコンストラクタ　　CSM_Context のコンストラクタから呼ばれる            
        /// </summary>
        /// <param name="db">親クラス CSM_Context のインスタンス</param>
        public HolidayRepository(CsmForAsml2Context db)
        {
            _db = db;
        }

        /// <summary>
        /// 全ての HolidayEntry を取得する
        /// </summary>
        /// <returns>全 HolidayEntry</returns>
        /// <seealso cref="Holidays"/>
        public async Task<IEnumerable<HolidayEntry>> GetAllRecordsAsync()
        {
            return await _db.Holidays.ToListAsync();
        }

        /// <summary>
        /// 指定した条件に合致する HolidayEntry (複数)を取得する
        /// </summary>
        /// <param name="predicate">条件式 通常ラムダ式で指定</param>
        /// <returns>条件に合致する HolidayEntry (複数)</returns>
        /// <seealso cref="Holidays"/>
        public IEnumerable<HolidayEntry> GetRecords(Func<HolidayEntry, bool> predicate)
        {
            return _db.Holidays.Where(predicate);
        }

        /// <summary>
        /// 指定したIDに対する HolidayEntry を取得する
        /// </summary>
        /// <param name="id">HolidayEntry のid (日付)。 </param>
        /// <returns>指定した ID の HolidayEntry</returns>
        /// <seealso cref="Holidays"/>
        public HolidayEntry GetRecord(object id)
        {
            return _db.Holidays.Find(id);
        }


        /// <summary>
        /// データベースに HolidayEntry を追加する
        /// </summary>
        /// <param name="Holidays">追加する HolidayEntry</param>
        /// <seealso cref="Holidays"/>
        public void AddRecord(HolidayEntry Holidays)
        {
            try
            {
                _db.Holidays.Add(Holidays);
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
        /// HolidayEntry に変更があれば、データベースを更新する
        /// </summary>
        /// <param name="Holidays">更新する HolidayEntry</param>
        /// <seealso cref="Holidays"/>
        public void UpdateRecord(HolidayEntry Holidays)
        {
            try
            {
                _db.Entry(Holidays).State = EntityState.Modified;
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
        /// HolidayEntry を削除する
        /// </summary>
        /// <param name="id">削除する HolidayEntry の ID </param>        
        /// <seealso cref="Holidays"/>
        public void RemoveRecord(object id)
        {
            try
            {
                HolidayEntry tgt = _db.Holidays.Find(id);
                _db.Holidays.Remove(tgt);
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
