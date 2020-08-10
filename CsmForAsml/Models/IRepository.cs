using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Threading.Tasks;


namespace CsmForAsml.Models {
    /// <summary>
    /// TModel クラスを、データベースに入出力する Repository 用のインターフェース　このインターフェースを持つ Repository クラスはこのインターフェースで定義する全てのメソッドを備える
    /// </summary>
    /// <typeparam name="TModel">このRepositoryが扱うデータモデル</typeparam>
    public interface IRepository<TModel> : IDisposable {

        /// <summary>
        /// TModel クラスの全てのレコードをデータベースから取得する
        /// </summary>
        /// <returns>取得した全レコード</returns>
        Task<IEnumerable<TModel>> GetAllRecordsAsync();

        /// <summary>
        /// TModel クラスのうち、指定した条件式に合致するレコードをデータベースから取得する
        /// </summary>
        /// <param name="predicate">条件式 通常ラムダ式で指定</param>
        /// <returns>取得した(条件式に合致する)全レコード</returns>
        IEnumerable<TModel> GetRecords(Func<TModel, bool> predicate);

        /// <summary>
        /// 一意の識別子 id を指定して、該当するレコードを取得する
        /// </summary>
        /// <param name="id">レコードを識別する id </param>
        /// <returns>取得したレコード</returns>
        TModel GetRecord(object id);

        /// <summary>
        /// データベースにレコードを追加する      
        /// </summary>
        /// <param name="report">追加する TModelクラスのレコード</param>
        void AddRecord(TModel report);

        /// <summary>
        /// データベースにレコードの変更を保存する
        /// </summary>
        /// <param name="report">変更を保存する TModelクラスのレコード</param>
        void UpdateRecord(TModel report);

        /// <summary>
        /// データベースから指定したレコードを削除する
        /// </summary>
        /// <param name="id">削除する TModelクラスのレコードを識別する id</param>
        void RemoveRecord(object id);
    }

}

