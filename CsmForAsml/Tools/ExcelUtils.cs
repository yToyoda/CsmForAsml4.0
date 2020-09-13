using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.WindowsAzure.Storage; // Namespace for CloudStorageAccount
using Microsoft.WindowsAzure.Storage.Blob; // Namespace for Blob storage types
using SysIO = System.IO;


namespace CsmForAsml.Tools {
    /// <summary>
    /// DocumentFormat.OpenXml を使用して、エクセルファイルの作成をサポートするユーティリティー。</summary>
    /// <remarks>
    /// 作成するファイルは基本的に Column = A, Row = StartLine から始まるテーブルである。
    /// <para>AddCell() の入力対象セルは、最初は Column = A, Row = StartLine を指している。</para>
    /// <para>AddCell() でデータをデータ入力後、対象セルは一つ右の Column に移動する。　EndRow()  は、一つの行の終わりを示す。</para>
    /// <para>EndRow() をコール後は対象セルは、一つ下の行の Column A となる。</para>
    /// <para>最後のデータ行を追加し終えたら、GetExcelFile で、ExcelFile のストリームを取得できる。</para>
    /// </remarks>
    public class CreateExcel :IDisposable{
        /// <summary>
        /// デフォールトコンストラクタ
        /// </summary>
        public CreateExcel() {
            StartLine = 2;
        }
        /// <summary>
        /// Excel Fileの何行目からデータを記入するかを指定する。　デフォールトは 2 (2行目から)
        /// </summary>
        public UInt32 StartLine { get; set; }

        /// <summary>
        ///セルスタイルの指定用 Dictionary
        /// </summary>
        /// <remarks>
        /// セルのスタイル指定子 (UInt32)を名前で管理するための Dictionary 
        /// 使用例
        /// <code language="C#">        
        ///    CreateExcel _crExcel = new CreateExcel();
        ///    _crExcel.StyleDic.Add("Default", 1);
        ///    _crExcel.StyleDic.Add("Gray String", 3);
        ///    _crExcel.StyleDic.Add("Date", 2);
        ///    _crExcel.StyleDic.Add("Green Date", 4);
        ///    _crExcel.StyleDic.Add("Yellow Date", 5);
        ///    _crExcel.StyleDic.Add("Red Date", 6);        
        /// </code>
        /// </remarks>
        public Dictionary<String, UInt32> StyleDic { get; set; }

        /// <summary>
        /// エクセルファイルを作成するための MemoryStream この中にエクセルファイルが作成される
        /// </summary>
        private SysIO.MemoryStream _ms;

        /// <summary>
        /// エクセルの中の SpreadsheetDocument のインスタンス
        /// </summary>
        private SpreadsheetDocument _document;

        /// <summary>
        /// エクセルの中の WorkbookPart のインスタンス
        /// </summary>
        private WorkbookPart _wbPart;

        /// <summary>
        /// エクセルの中の Worksheet のインスタンス
        /// </summary>
        private Worksheet _ws;

        /// <summary>
        /// エクセルの中の SheetData のインスタンス
        /// </summary>
        private SheetData _sheetData;

        /// <summary>
        /// エクセルの中の SharedStringTable のインスタンス
        /// </summary>
        private SharedStringTable _sharedStringTable;

        /// <summary>
        /// エクセルの中の SharedStringTable を更新する時に使用する Id 
        /// </summary>
        private Int32 _sharedStringId;

        /// <summary>
        /// AddCell() で、エクセルにデータを追加している間、一時的に文字列とキーのペアを保存する Dictionary
        /// </summary>
        private Dictionary<string, Int32> _sharedStringDic;    

        /// <summary>
        /// 現在のエクセルの行番号
        /// </summary>
        private UInt32 _lineIndex;

        /// <summary>
        /// 現在のエクセルのカラムを表す Id (AddCell()のcall毎に A, B, C ... と増える)
        /// </summary>
        private string _colid;

        /// <summary>
        /// エクセルの Row のインスタンス　: 現在編集中の Row を示す。　EndRow() がコールされた時に、これまでの Row が _sheetData　に Append され、新しい Row が生成される。
        /// </summary>
        private Row _currentRow;
        /// <summary>
        /// 指定された Excelのテンプレートファイルを読み込む
        /// </summary>
        /// <remarks>テンプレートは、connectionString [KSCM_Bolb] の "templates" という container から読み込む。</remarks>
        /// <param name="filename">"tempates"コンテナの中のテンプレートのファイル名</param>
        /// <param name="sheetname">テンプレート中で使用するシート名</param>
        public async void LoadTemplate(string filename, string sheetname) {           
            _ms = new SysIO.MemoryStream(); ;
            string connectionstring = Startup.AppSettings["AzureBlob"];
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(connectionstring);
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();
            CloudBlobContainer container = blobClient.GetContainerReference("templates");
            CloudBlockBlob blockBlob = container.GetBlockBlobReference(filename);
            //SysIO.Stream templateStream = blockBlob.OpenRead();
            //fileinfo.FileByteStream = blockBlob.OpenRead();
            SysIO.Stream frs = await blockBlob.OpenReadAsync();
            frs.CopyTo(_ms);
            long bytesInStream = _ms.Length;
            bool canread = _ms.CanRead;
            bool canwrite = _ms.CanWrite;
            frs.Close();

            _document = SpreadsheetDocument.Open(_ms, true);
            _wbPart = _document.WorkbookPart;
            Sheet theSheet = _wbPart.Workbook.Descendants<Sheet>().Where(s => s.Name == sheetname).FirstOrDefault();
            if (theSheet == null) {
                throw new ArgumentException("sheetName");
            }
            WorksheetPart wsPart = (WorksheetPart)(_wbPart.GetPartById(theSheet.Id));
            _ws = wsPart.Worksheet;
            Columns columns = _ws.Descendants<Columns>().FirstOrDefault();

            _sheetData = _ws.Descendants<SheetData>().FirstOrDefault();
            var rows = _sheetData.Descendants<Row>();
            int nrows = rows.Count();
            Row firstRow = _sheetData.Descendants<Row>().ElementAt(0); // get first row , line 1
            firstRow.DyDescent = 0.3D;
            for (int i = nrows-1; i > 0; --i) {
                    Row rowtodelete = _sheetData.Descendants<Row>().ElementAt(i); // get  line i 
                    rowtodelete.Remove();
            }

            _sharedStringDic = new Dictionary<string, int>();
            SharedStringTablePart sharedStringPart = _wbPart.GetPartsOfType<SharedStringTablePart>().First();
            _sharedStringTable = sharedStringPart.SharedStringTable;
            _sharedStringId = 0;
            foreach (SharedStringItem item in _sharedStringTable.Elements<SharedStringItem>()) {  // read shared string and add to Dictionary
                if (item.InnerText != null) {
                    _sharedStringDic.Add(item.InnerText, _sharedStringId);
                    ++_sharedStringId;
                }
            }
            _lineIndex = StartLine;
            _colid = "A";
            _currentRow = new Row() { RowIndex = _lineIndex, Spans = new ListValue<StringValue>() { InnerText = "1:20" }, Height = 16.5D, CustomHeight = true, DyDescent = 0.3D };
            StyleDic = new Dictionary<string, uint>();
        }

        /// <summary>
        /// 行の終了した時にコールする。　ここまでに追加したセルを含む行をシートに追加し、新しい行を作成する
        /// </summary>
        public void EndRow() {
            _sheetData.AppendChild<Row>(_currentRow);
            ++_lineIndex;
            _colid = "A";
            _currentRow = new Row() { RowIndex = _lineIndex, Spans = new ListValue<StringValue>() { InnerText = "1:20" }, Height = 16.5D, CustomHeight = true, DyDescent = 0.3D };           
        }

        /// <summary>
        /// セルに指定したデータ(string)を入力する。
        /// </summary>
        /// <param name="value">セルに入力される文字列(string)のデータ</param>
        /// <param name="cellStyle">StyleDicに定義したスタイル名 省略時は "Default"</param>
        public void AddCell(string value, string cellStyle = "Default") {
            UInt32 si = StyleDic[cellStyle];
            Cell newCell = new Cell() { CellReference = _colid + _lineIndex.ToString(), DataType = CellValues.SharedString, StyleIndex = si };
            string id = AddToSharedString(_sharedStringDic,value).ToString();
            newCell.CellValue = new CellValue(id);
            _currentRow.Append(newCell);
            _colid = IncreColId(_colid);
        }

        /// <summary>
        /// セルに指定したデータ(DateTime?)を入力する。
        /// </summary>
        /// <param name="value">セルに入力される日付(DateTime?)のデータ nullの時は空白セルとなる</param>
        /// <param name="cellStyle">StyleDicに定義したスタイル名　省略時は "Date"</param>
        public void AddCell(DateTime? value , string cellStyle = "Date") {
            UInt32 si = StyleDic[cellStyle];
            Cell newCell = new Cell() { CellReference = _colid + _lineIndex.ToString(), StyleIndex = si };
            if (value != null) {
                newCell.CellValue = new CellValue(((DateTime)value).ToOADate().ToString());
            } else {
                newCell.CellValue = new CellValue();
            }
            _currentRow.Append(newCell);
            _colid = IncreColId(_colid);
        }

        /// <summary>
        /// セルに指定したデータ(DateTime)を入力する。
        /// </summary>
        /// <param name="value">セルに入力される日付(DateTime)のデータ</param>
        /// <param name="cellStyle">StyleDicに定義したスタイル名　省略時は "Date"</param>
        public void AddCell(DateTime value, string cellStyle = "Date") {
            UInt32 si = StyleDic[cellStyle];
            Cell newCell = new Cell() { CellReference = _colid + _lineIndex.ToString(), StyleIndex = si };
            newCell.CellValue = new CellValue(((DateTime)value).ToOADate().ToString());
            _currentRow.Append(newCell);
            _colid = IncreColId(_colid);
        }

        /// <summary>
        /// セルに指定したデータ(int?)を入力する。
        /// </summary>
        /// <param name="value">セルに入力される数値(int?型)のデータ nullの時は空白セルとなる</param>
        /// <param name="cellStyle">StyleDicに定義したスタイル名 省略時は "Default"</param>
        public void AddCell(int? value, string cellStyle = "Default") {
            UInt32 si = StyleDic[cellStyle];
            Cell newCell = new Cell() { CellReference = _colid + _lineIndex.ToString(), DataType = CellValues.Number, StyleIndex = si };
            if (value != null) {
                newCell.CellValue = new CellValue(value.ToString());
            } else {
                newCell.CellValue = new CellValue();
            }
            _currentRow.Append(newCell);
            _colid = IncreColId(_colid);
        }

        /// <summary>
        /// セルに指定したデータ(int)を入力する。
        /// </summary>
        /// <param name="value">セルに入力される数値(int型)のデータ</param>
        /// <param name="cellStyle">StyleDicに定義したスタイル名 省略時は "Default"</param>
        public void AddCell(int value, string cellStyle = "Default") {
            UInt32 si = StyleDic[cellStyle];
            Cell newCell = new Cell() { CellReference = _colid + _lineIndex.ToString(), DataType = CellValues.Number, StyleIndex = si };
            newCell.CellValue = new CellValue(value.ToString());            
            _currentRow.Append(newCell);
            _colid = IncreColId(_colid);
        }

        /// <summary>
        /// セルに指定したデータ(double?)を入力する。
        /// </summary>
        /// <param name="value">セルに入力される数値(double?型)のデータ nullの時は空白セルとなる</param>
        /// <param name="cellStyle">StyleDicに定義したスタイル名 省略時は "Default"</param>
        public void AddCell(double? value, string cellStyle = "Default") {
            UInt32 si = StyleDic[cellStyle];
            Cell newCell = new Cell() { CellReference = _colid + _lineIndex.ToString(), DataType = CellValues.Number, StyleIndex = si };
            if (value != null) {
                newCell.CellValue = new CellValue(value.ToString());
            } else {
                newCell.CellValue = new CellValue();
            }
            _currentRow.Append(newCell);
            _colid = IncreColId(_colid);
        }

        /// <summary>
        /// セルに指定したデータ(double)を入力する。
        /// </summary>
        /// <param name="value">セルに入力される数値(double型)のデータ nullの時は空白セルとなる</param>
        /// <param name="cellStyle">StyleDicに定義したスタイル名 省略時は "Default"</param>
        public void AddCell(double value, string cellStyle = "Default") {
            UInt32 si = StyleDic[cellStyle];
            Cell newCell = new Cell() { CellReference = _colid + _lineIndex.ToString(), DataType = CellValues.Number, StyleIndex = si };
            newCell.CellValue = new CellValue(value.ToString());
            _currentRow.Append(newCell);
            _colid = IncreColId(_colid);
        }

        /// <summary>
        /// 作成した Excelファイルを持つ、MemoryStream を返す
        /// </summary>
        /// <returns>作成した Excelファイル</returns>
        public System.IO.MemoryStream GetExcelFile() {
            
            Int32 count = 0;
            foreach (string key in _sharedStringDic.Keys) {
                if (count >= _sharedStringId) {
                    _sharedStringTable.AppendChild(new SharedStringItem(new DocumentFormat.OpenXml.Spreadsheet.Text(key)));
                }
                ++count;
            }
            _sharedStringTable.Save();
            _ws.Save();
            _wbPart.Workbook.Save();
            _document.Close();

            _ms.Position = 0;
            return _ms;
        }

        /// <summary>
        /// Column ID  (A,B,C,... ) を一つ増加させる  Zの次は "AA" となる
        /// </summary>
        /// <param name="colId">現在の Column ID </param>
        /// <returns>増加された ColumnID</returns>
        private string IncreColId(string colId) {
            int ndigits = colId.Length;
            char[] idchar = colId.ToCharArray();                        
            bool carry = true;
            for (int digi = ndigits -1; digi >= 0; --digi) {
                char cc = idchar[digi];
                if (cc >= 'A' && cc <= 'Z') {
                    if (carry) {
                        char nc = next(idchar[digi]);
                        idchar[digi] = nc;
                        if (nc == 'A') {
                            carry = true;
                        } else {
                            carry = false;
                        }
                    }
                } else {
                    throw new Exception("column ID is invalid :" + colId);
                }
            }
            string newColId = new string(idchar);
            if (carry) { // add 1 more digit
                newColId = "A" + newColId;
            }
            return newColId;
        }

        /// <summary>
        /// IncreColId の下請けルーチン　1文字の ID を増加させる。 IDが Z の時は A を返す
        /// </summary>
        /// <param name="cur">現在のID</param>
        /// <returns>一つ増加されたID</returns>
        private char next (char cur) {
            if (cur < 'Z') {
                return (char) ((int) cur + 1);
            } else {
                return 'A';
            }
        }

        /// <summary>
        /// OpenXml が string 形式のデータを内部保持するための dictionary "sharedString" へ文字列を追加する
        /// 既に dictionary に定義済みの文字列の時は id を返す
        /// 新しい文字列の時は、dictionaryに追加後に id を返す
        /// </summary>
        /// <param name="dictionary">Dictionary形式のsharedstring</param>
        /// <param name="key">追加または確認する文字列</param>
        /// <returns></returns>
        private Int32 AddToSharedString(Dictionary<string, Int32> dictionary, string key) {
            Int32 id = -1;
            if (key == null) key = "";  // null to empty string
            if (dictionary.TryGetValue(key, out id)) {
                return id;
            } else {
                id = dictionary.Count;
                dictionary.Add(key, id);
                return id;
            }
        }

        /// <summary>
        /// ExcelUtilsのリソースを廃棄する
        /// </summary>
        public void Dispose() {
            Dispose(true);
        }

        /// <summary>
        /// ExcelUtilsのリソースを廃棄する
        /// </summary>
        /// <param name="disposing">trueの時に使用していたメモリーストリームを廃棄する</param>
        protected virtual void Dispose(bool disposing) {
            if (disposing) {
                if (_ms != null) _ms.Dispose();
            }
        }
    }
}