using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace CsmForAsml.Models
{
    public class ToolInventoryRepository : IRepository<ToolInventory>
    {

        /// <summary>
        /// CSM_Context (データベース)のインスタンス　このクラス (ToolInventoryRepository)内のローカル変数
        /// </summary>
        CsmForAsml2Context _db;

        /// <summary>
        /// ToolInventoryRepositoryのコンストラクタ　　CSM_Context のコンストラクタから呼ばれる            
        /// </summary>
        /// <param name="db">親クラス CSM_Context のインスタンス</param>
        public ToolInventoryRepository(CsmForAsml2Context db)
        {
            _db = db;
        }

        /// <summary>
        /// 全ての ToolInventory を取得する
        /// </summary>
        /// <returns>全 ToolInventory</returns>
        /// <seealso cref="ToolInventory"/>
        public async Task<IEnumerable<ToolInventory>> GetAllRecordsAsync()
        {
            return await _db.ToolInventory.ToListAsync();
        }

        /// <summary>
        /// 指定した条件に合致する ToolInventory (複数)を取得する
        /// </summary>
        /// <param name="predicate">条件式 通常ラムダ式で指定</param>
        /// <returns>条件に合致する ToolInventory (複数)</returns>
        /// <seealso cref="ToolInventory"/>
        public IEnumerable<ToolInventory> GetRecords(Func<ToolInventory, bool> predicate)
        {
            return _db.ToolInventory.Where(predicate);
        }

        /// <summary>
        /// 指定したIDに対する ToolInventory を取得する
        /// </summary>
        /// <param name="Serial">ToolInventory の Id である Serial (number) </param>
        /// <returns>指定した Serial の ToolInventory</returns>
        /// <seealso cref="ToolInventory"/>
        public ToolInventory GetRecord(object Serial)
        {
            return _db.ToolInventory.Find( Serial);
        }


        /// <summary>
        /// データベースに ToolInventory を追加する
        /// </summary>
        /// <param name="ToolInventory">追加する ToolInventory</param>
        /// <seealso cref="ToolInventory"/>
        public void AddRecord(ToolInventory ToolInventory)
        {
            try
            {
                _db.ToolInventory.Add(ToolInventory);
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
        /// ToolInventory に変更があれば、データベースを更新する
        /// </summary>
        /// <param name="ToolInventory">更新する ToolInventory</param>
        /// <seealso cref="ToolInventory"/>
        public void UpdateRecord(ToolInventory ToolInventory)
        {
            try
            {
                _db.Entry(ToolInventory).State = EntityState.Modified;
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
        /// ToolInventory を削除する
        /// </summary>
        /// <param name="id">削除する ToolInventory の ID (報告書ID)</param>        
        /// <seealso cref="ToolInventory"/>
        public void RemoveRecord(object id)
        {
            try
            {
                ToolInventory tgt = _db.ToolInventory.Find(id);
                _db.ToolInventory.Remove(tgt);
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
