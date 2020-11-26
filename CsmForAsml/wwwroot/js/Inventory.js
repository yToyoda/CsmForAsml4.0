if (!jQuery) { throw new Error("csm4.0 script requires jQuery") }

jQuery.browser = {};
(function () {
    jQuery.browser.msie = false;
    jQuery.browser.version = 0;
    if (navigator.userAgent.match(/MSIE ([0-9]+)\./)) {
        jQuery.browser.msie = true;
        jQuery.browser.version = RegExp.$1;
    }
})();

$(function () {
    $(".datepicker").datepicker({
        dateFormat: "yy/mm/dd",
        dayNamesMin: ['日', '月', '火', '水', '木', '金', '土']
    });
});

$(function () {  //main of slickgrid 
    "use strict";
    // 変数の宣言
    let grid;
    let data = [];
    let dataView;
    let columns = [];
    let checkboxSelector;
    let pager;
    let columnpicker;
    let options;
    let selectListReloadLevel = 0;
    let headerRowInputIds = [];
    let host = window.location.protocol + "//" + window.location.host;
    let connection = new signalR.HubConnectionBuilder().withUrl("/csmhub").build();
    let this_connectionId;
    let serialList;
    let currentSelectedRow = null;

    let moved = [];
    let inInCal = [];
    let calDateClose = [];
    let forcemove = [];
    let retserial;

    let dpMovedToInCal = $('#dpMovedToInCal');
    let dpRefusedToMove = $('#dpRefusedToMove');
    let dpDoYouMove = $('#dpDoYouMove');

    let buttonsYesNo = [
        {
            text: "No",
            width: 150,
            click: function () {
                $(this).dialog("close");
                initiateDialog();
            }
        },

        {
            text: "Yes",
            width: 150,
            click: function () {
                $(this).dialog("close");
                forcemove.push(retserial);
                initiateDialog();
            }
        },
    ];

    let buttonOk = [
        {
            text: "Ok",
            width: 200,
            click: function () {
                $(this).dialog("close");
                initiateDialog();
            }
        },
    ];

    dpMovedToInCal.dialog({
        dialogClass: "customdiag-ygreen",
        buttons: buttonOk,
        modal: true,
        show: { effect: "blind", duration: 100 },
        autoOpen: false,
        width: 600,
    })


    dpRefusedToMove.dialog({
        dialogClass: "customdiag-ygreen",
        buttons: buttonOk,
        modal: true,
        show: { effect: "blind", duration: 100 },
        autoOpen: false,
        width: 400,
    });

    dpDoYouMove.dialog({
        dialogClass: "customdiag-ygreen",
        buttons: buttonsYesNo,
        modal: true,
        show: { effect: "blind", duration: 100 },
        autoOpen: false,
        width: 400,
    });


    let filterValues = {
        texts: {},
        selection: null,
        dateFrom: [null, null, null, null],
        dateTo: [null, null, null, null],
    };


    connection.start().then(function () {
        console.log('Now connected, connection ID=' + connection.connectionId);
        this_connectionId = connection.connectionId
    }).catch(function (err) {
        return console.error(err.toString());
    });

    connection.on("HistoryFinished", function (filename) {
        // do nothing
    });

    connection.on("LatestCalCert", function (filename) {
        if (filename === null || filename === "") {
            alert("保存されている校正証明書はありませんでした");
        } else {
            window.open(host + "/CalHistory/ShowPdf/" + filename);
        }
    });

    const myFilter = function (item, args) {
        let datenames = ["CalDue", "LatestCalDate", "SafetyDue", "LatestSafetyDate"];
        // by selection
        if (args.selection !== null) {
            if (args.selection !== item.sel) {
                return false;
            }
        }
        // text filters        
        for (let columnId in args.texts) {
            if ((columnId) && (args.texts[columnId])) {
                let val = item[columnId];  // in order to this statement work, keep 'id:' is equal to 'field:' in column definition
                if (!Boolean(val) || val.toUpperCase().indexOf(args.texts[columnId]) === -1) {
                    return false;
                }
            }
        }


        // date filters
        let tgt;
        for (let i = 0; i < 4; i++) {
            if (args.dateFrom[i] !== null) {
                tgt = item[datenames[i]];
                if (!(tgt) || moment(tgt, "YYYY/MM/DD").isBefore(args.dateFrom[i], "day")) return false;
            }
            if (args.dateTo[i] !== null) {
                tgt = item[datenames[i]];
                if (!(tgt) || moment(tgt, "YYYY/MM/DD").isAfter(args.dateTo[i], "day")) return false;
            }
        }
        return true;
    };


    const copyselection = function () {
        let selectedrows = grid.getSelectedRows();
        let arow;

        let len = grid.getDataLength();
        for (let i = 0; i < len; i += 1) {
            arow = dataView.getItem(i);
            arow['sel'] = false;
        }

        selectedrows.forEach(function (value) {
            arow = dataView.getItem(value);
            arow['sel'] = true;
        });
    };

    const restoreSelection = function () {
        let selectedrows = grid.getSelectedRows();
        let arow;

        let len = grid.getDataLength();
        for (let i = 0; i < len; i += 1) {
            arow = dataView.getItem(i);
            if (arow['sel']) {
                if (selectedrows.indexOf(i) < 0) {
                    selectedrows.push(i);
                }
            }
        }
        grid.setSelectedRows(selectedrows);
    };

    const updateFilter = function () {
        copyselection();
        dataView.setFilterArgs(filterValues);
        dataView.refresh();
        restoreSelection();
        showNumber();
        updateDropdownList();
    };

    const updateDropdownList = function () {
        let plantList = {}, calPlaceList = {};
        let plantA = [], calPlaceA = [];
        let materialList = {}, serialList = {};
        let materialA = [], serialA = [];
        let nShowing = dataView.getLength();
        let aRow;

        for (let i = 0; i < nShowing; i += 1) {
            aRow = dataView.getItem(i);
            plantList[aRow.Plant] = true;
            calPlaceList[aRow.CalPlace] = true;
            materialList[aRow.Material] = true;
            serialList[aRow.SerialNumber] = true;

        }

        if (selectListReloadLevel === 0) {
            if (!(filterValues.texts.Plant)) {
                for (let p in plantList) {
                    plantA.push(p);
                }
                plantA.sort();
                setDropdownList("#selectPlant", plantA);
            }
            if (!(filterValues.texts.CalPlace)) {
                for (let c in calPlaceList) {
                    calPlaceA.push(c);
                }
                calPlaceA.sort();
                setDropdownList("#selectCalPlace", calPlaceA);
            }
        }

        if (selectListReloadLevel <= 1) {
            for (let m in materialList) {
                materialA.push(m);
            }
            materialA.sort();
            setDropdownList("#selectMaterial", materialA);
        }

        if (selectListReloadLevel <= 2) {
            for (let s in serialList) {
                serialA.push(s);
            }
            serialA.sort();
            setDropdownList("#selectSerial", serialA);
        }
    };

    const firstDay = function (monthoffset) {
        let m = moment();
        //let m = moment("2020-05-15");
        let ans = m.date(1);
        ans = ans.add(monthoffset, "month");
        return ans;
    };

    const lastDayoftheMonth = function (monthoffset) {
        let m = moment();
        //let m = moment("2020-05-15");
        let ans = m.date(1);
        ans = ans.add(Number(monthoffset) + 1, "month").add(-1, "day");
        return ans;
    };


    const showNumber = function () {
        let totalNumber = data.length;
        let showing = dataView.getLength();
        // let show2 = grid.getDataLength();    //these two show the same number         
        $('#NumShowing').text(showing);
        $('#NumTotal').text(totalNumber);
    };


    const setDropdownList = function (cssSelector, list) {
        let $select = $(cssSelector);
        let len = list.length;
        let $option;

        $select.empty();
        $option = $("<option>")
            .val("")
            .text("---")
            .prop("selected", false);
        $select.append($option);
        for (let i = 0; i < len; i += 1) {
            let item = list[i];
            $option = $("<option>")
                .val(item)
                .text(item)
                .prop("selected", false);
            $select.append($option);
        }
    };

    const clrDateFilters = function () {
        $('input[name="rdCalDue"]:radio').val([0]);
        $('input[name="rdCalDate"]:radio').val([0]);
        $('input[name="rdSDue"]:radio').val([0]);
        $('input[name="rdSDate"]:radio').val([0]);
        $('input[name="tab_item"]:radio').val([1]);
        for (let i = 0; i < 4; i += 1) {
            clearDateFromTo(i);
            filterValues.dateFrom[i] = null;
            filterValues.dateTo[i] = null;
        }
    };

    const clearDateFromTo = function (index) {
        let id1 = `#din${index}`;
        $(id1 + 'From').val(null);
        $(id1 + 'From').css('background-color', 'white');
        $(id1 + 'To').val(null);
        $(id1 + 'To').css('background-color', 'white');
    };

    const filterValChanged = function () {
        let columnId = $(this).data("columnId");
        let kwd = $(this).val();
        if (kwd) {
            kwd = $.trim(kwd).toUpperCase();
        } else {
            kwd = "";
        }
        filterValues.texts[columnId] = kwd;
        selectListReloadLevel = 0;
        updateFilter();
    };

    $(window).on('resize', function () {
        grid.resizeCanvas();
        grid.render();
    });

    // events from ".filterPannel #b1"

    $("#selectPlant").on("change", function () {
        filterValues.texts['Plant'] = $(this).val();
        selectListReloadLevel = 1;
        updateFilter();
    });

    $("#selectCalPlace").on("change", function () {
        filterValues.texts['CalPlace'] = $(this).val();
        selectListReloadLevel = 1;
        updateFilter();
    });

    $("#selectMaterial").on("change", function () {
        filterValues.texts['Material'] = $(this).val();
        selectListReloadLevel = 2;
        updateFilter();
    });

    $("#selectSerial").on("change", function () {
        filterValues.texts['SerialNumber'] = $(this).val();
        selectListReloadLevel = 3;
        updateFilter();
    });

    $('#clrSelBtn').click(function () {
        let selectedrows = [];
        grid.setSelectedRows(selectedrows); //現在ページの選択行解除
        let oData = dataView.getItems();
        for (let x of oData) {
            x.sel = false;              //全ての行の選択フラグをリセット
        }
    });

    $('input[name="filBySel"]:radio').change(function () {
        let sel = $(this).val();
        switch (sel) {
            case "0":
                filterValues.selection = null;
                break;
            case "1":
                filterValues.selection = true;
                break;
            case "2":
                filterValues.selection = false;
                break;
        }
        selectListReloadLevel = 0;
        updateFilter();
    });

    // events from ".filterPannel #b2"

    $('#clrAllFil').click(function () {
        clrDateFilters();
        delete filterValues.texts;
        filterValues.texts = {}; // re new texts 
        filterValues.selection = null;
        $('input[name="filBySel"]:radio').val([0]);
        selectListReloadLevel = 0;
        for (var i of headerRowInputIds) {
            $(`input#${i}`).val("");
            //$(i).val("");
        }
        updateFilter();
    });

    $('#clrDateFil').click(function () {
        clrDateFilters();
        selectListReloadLevel = 0;
        updateFilter();
    });

    const setDateFil = function (sel, index, d1from, d1to, d2from, d2to) {
        switch (sel) {
            case "0":
                filterValues.dateFrom[index] = null;
                filterValues.dateTo[index] = null;
                clearDateFromTo(index);
                break;
            case "1":
                filterValues.dateFrom[index] = d1from;
                filterValues.dateTo[index] = d1to;
                clearDateFromTo(index);
                break;
            case "2":
                filterValues.dateFrom[index] = d2from;
                filterValues.dateTo[index] = d2to;
                clearDateFromTo(index);
                break;
            default:
                break;
        }
    };

    $('input[name="rdCalDue"]:radio').change(function () {
        let sel = $(this).val();
        setDateFil(sel, 0, null, moment(), firstDay(0), lastDayoftheMonth(0));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $('#din0From').on('change', function () {
        let dateinput = $(this).val()
        filterValues.dateFrom[0] = moment(dateinput, "YYYY/MM/DD");
        $('input[name="rdCalDue"]:radio').val([4]);
        $("#din0From").css('background-color', 'aquamarine');
        $('#din0To').datepicker('option', 'minDate', new Date(dateinput));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $("#din0To").on("change", function () {
        let dateinput = $(this).val();
        filterValues.dateTo[0] = moment(dateinput, "YYYY/MM/DD");
        $('input[name="rdCalDue"]:radio').val([4]);
        $("#din0To").css('background-color', 'aquamarine');
        $('#din0From').datepicker('option', 'maxDate', new Date(dateinput));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $('input[name="rdCalDate"]:radio').change(function () {
        let sel = $(this).val();
        setDateFil(sel, 1, firstDay(0), lastDayoftheMonth(0), firstDay(-1), lastDayoftheMonth(-1));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $('#din1From').on('change', function () {
        let dateinput = $(this).val()
        filterValues.dateFrom[1] = moment(dateinput, "YYYY/MM/DD");
        $('input[name="rdCalDate"]:radio').val([4]);
        $("#din1From").css('background-color', 'aquamarine');
        $('#din1To').datepicker('option', 'minDate', new Date(dateinput));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $("#din1To").on("change", function () {
        let dateinput = $(this).val();
        filterValues.dateTo[1] = moment(dateinput, "YYYY/MM/DD");
        $('input[name="rdCalDate"]:radio').val([4]);
        $("#din1To").css('background-color', 'aquamarine');
        $('#din1From').datepicker('option', 'maxDate', new Date(dateinput));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $('input[name="rdSDue"]:radio').change(function () {
        let sel = $(this).val();
        setDateFil(sel, 2, null, moment(), firstDay(0), lastDayoftheMonth(0));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $('#din2From').on('change', function () {
        let dateinput = $(this).val()
        filterValues.dateFrom[2] = moment(dateinput, "YYYY/MM/DD");
        $('input[name="rdSDue"]:radio').val([4]);
        $("#din2From").css('background-color', 'aquamarine');
        $('#din2To').datepicker('option', 'minDate', new Date(dateinput));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $("#din2To").on("change", function () {
        let dateinput = $(this).val();
        filterValues.dateTo[2] = moment(dateinput, "YYYY/MM/DD");
        $('input[name="rdSDue"]:radio').val([4]);
        $("#din2To").css('background-color', 'aquamarine');
        $('#din2From').datepicker('option', 'maxDate', new Date(dateinput));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $('input[name="rdSDate"]:radio').change(function () {
        let sel = $(this).val();
        setDateFil(sel, 3, firstDay(0), lastDayoftheMonth(0), firstDay(-1), lastDayoftheMonth(-1));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $('#din3From').on('change', function () {
        let dateinput = $(this).val()
        filterValues.dateFrom[3] = moment(dateinput, "YYYY/MM/DD");
        $('input[name="rdSDate"]:radio').val([4]);
        $('#din3From').css('background-color', 'aquamarine');
        $('#din3To').datepicker('option', 'minDate', new Date(dateinput));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $("#din3To").on("change", function () {
        let dateinput = $(this).val();
        filterValues.dateTo[3] = moment(dateinput, "YYYY/MM/DD");
        $('input[name="rdSDate"]:radio').val([4]);
        $("#din3To").css('background-color', 'aquamarine');
        $('#din3From').datepicker('option', 'maxDate', new Date(dateinput));
        selectListReloadLevel = 0;
        updateFilter();
    });

    // fnkey1 Download to Excel 
    $('#fnkey1').click(function () {
        let totalNumber = data.length;
        let arow;
        let serialNumberList = [];
        copyselection();
        for (let i = 0; i < totalNumber; i += 1) {
            arow = dataView.getItemByIdx(i);
            if (arow.sel) {
                serialNumberList.push(arow.SerialNumber);
            }
        };

        if (serialNumberList.length > 0) {

            let postData = {
                SerialNums: serialNumberList
            };   // 受け取り側 C#のクラスのProperty名と一致した Property名を付けること
            // そうしないと、C#側で受け取りのパラメータに null が渡る
            postToHost(host + "/ToolInventories/Download", postData, receiveFilename)
        } else {
            alert("Download する行に ✔ を入れてから、このボタンを押してください");
        }
    });

    const receiveFilename = function (ret) {
        let filename = ret.responseJSON;
        let url = host + "/ToolInventories/ShowExcel?Filename=" + filename;
        window.open(url, "ExcelWindow");
    }



    $('#fnkey2').click(function () {
        //<button id="fnkey2">Cal History</button>
        let arow;
        if (currentSelectedRow != null) {
            arow = grid.getDataItem(currentSelectedRow);
            window.open(host + "/CalHistory/History/" + arow.SerialNumber + "?ConId=" + this_connectionId);
        }
    });


    $('#fnkey3').click(function () {
        //<button id="fnkey3">Latest Cal Cert</button>
        let arow;
        if (currentSelectedRow != null) {
            arow = grid.getDataItem(currentSelectedRow);
            //window.open(host + "/CalHistory/LatestCalCert/" + arow.SerialNumber + "?ConId=" + this_connectionId);
            $.get(host + "/CalHistory/LatestCalCert/" + arow.SerialNumber + "?ConId=" + this_connectionId);
        }
    });

    // fnkey4  Move to Incal
    $('#fnkey4').click(function () {
        //let totalNumber = data.length;
        //let arow;
        let serialNumberList = [];
        let nocheckflaglist = [];

        /*  skip this sectio for test
        copyselection();
        for (let i = 0; i < totalNumber; i += 1) {
            arow = dataView.getItemByIdx(i);
            if (arow.sel) {
                serialNumberList.push(arow.SerialNumber);
                nocheckflaglist.push(false);
            }
        };
        */
        //serialNumberList = ["1000319532", "1000056385", "1000010007", "1000018095", "1000065080", "H03487", "U0940448","1000034387"];
        //nocheckflaglist = [false, false, false, false, false, false, false, false];
        serialNumberList = ["1000091806", "1000010007", "H03487","1000228961", "U0940448", "1000034387"];
        nocheckflaglist = [false, false, false, false, false, false];
        

        let postData = {
            ConnectionId: this_connectionId,
            SerialNums: serialNumberList,
            NoCheckFlags: nocheckflaglist
        };   // 受け取り側 C#のクラスのProperty名と一致した Property名を付けること
        // そうしないと、C#側で受け取りのパラメータに null が渡る

        postToHost(host + "/ToolInventories/MoveToIncal", postData, returnFromIncal);
    });

    const resendToInCal = function () {
        // forece move to Incal 
        let arow;
        let serialNumberList = [];
        let nocheckflaglist = [];

        while (forcemove.length > 0) {
            arow = forcemove.pop();
            serialNumberList.push(arow.SerialNumber);
            nocheckflaglist.push(true);
        };

        let postData = {
            ConnectionId: this_connectionId,
            SerialNums: serialNumberList,
            NoCheckFlags: nocheckflaglist
        };   // 受け取り側 C#のクラスのProperty名と一致した Property名を付けること
        // そうしないと、C#側で受け取りのパラメータに null が渡る

        postToHost(host + "/ToolInventories/MoveToIncal", postData, returnFromIncal);

    }

    const checkDuedate = function (ardata) {
        let d0 = moment();
        let d1 = firstDay(1);
        let d2 = firstDay(2);
        let caldue;
        // check cal due and generate CalDueStatus
        for (let i = 0; i < ardata.length; i += 1) {
            let status = "";
            caldue = moment(ardata[i].CalDue, "YYYY/MM/DD");
            if (caldue.isBefore(d0, "day")) {
                status = "OverDue";
            } else if (caldue.isBefore(d1, "day")) {
                status = "Due TM";
            } else if (caldue.isBefore(d2, "day")) {
                status = "Due NM";
            };
            ardata[i].CalDueStatus = status;
        }
    }

    const returnFromIncal = function (ret) {
        data = ret.responseJSON;
        moved = [];
        inInCal = [];
        calDateClose = [];
        forcemove = [];

        if (data.length > 0) {
            for (let i = 0; i < data.length; ++i) {

                if (data[i].MoveToIncal === true) {
                    moved.push(data[i]);
                } else if (data[i].InInCal === true) {
                    inInCal.push(data[i]);
                } else {
                    calDateClose.push(data[i]);
                }
            }
            const listParent = document.getElementById('serialField');
            while (listParent.firstChild) {
                listParent.removeChild(listParent.firstChild);
            }
            initiateDialog();
        }
    }

    const initiateDialog = function () {
        if (inInCal.length > 0) {
            let x = inInCal.shift();
            $('#dlpSerial4').text(x.SerialNumber);
            dpRefusedToMove.dialog('open');
            return
        }
        if (calDateClose.length > 0) {
            retserial = calDateClose.shift();
            $('#dlpSerial5').text(retserial.SerialNumber);
            $('#d-message05').text(retserial.CommentToUser);
            dpDoYouMove.dialog('open');
            return;
        }        
        if (moved.length > 0) {
            let j = 0;
            let textline = "";
            for (let i = 0; i < moved.length; ++i) {
                textline = textline + moved[i].SerialNumber + "　";
                if (j == 4) {
                    let fld = $('#serialField')
                    let li = document.createElement("li");
                    li.textContent = textline;
                    document.getElementById('serialField').appendChild(li);
                    j = 0;
                    textline = "";
                } else {
                    ++j;
                }
            }
            if (textline != "") {
                let li = document.createElement("li");
                li.textContent = textline;
                li.className = 'lsl'
                document.getElementById("serialField").appendChild(li);
            }
            moved = [];
            dpMovedToInCal.dialog('open');
            return;
        }
        // final processing,  全ての配列が 0 個になった時にここに来る
        if (forcemove.length > 0) {
            resendToInCal();
        }
    };

    
    // events from fnkey area
    const postToHost = function (urlto, post_data, success) {
        let jsonstring = JSON.stringify(post_data); // JSONの文字列に変換
        $.ajax({
            type: 'POST',
            url: urlto,
            data: jsonstring,
            processData: true,
            contentType: 'application/json charset=utf-8',    // content-typeをJSONに指定する
            error: function () {
                console.error("Error sending Json to " + urlto);
            },
            complete: success ,
        });
    }


    // main routine execution start from here

    checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel"
    });

    columns.push(checkboxSelector.getColumnDefinition());

    // id !== field
    columns.push({ id: "Plant", name: "Plant", field: "Plant", sortable: true, editor: Slick.Editors.TextNC });
    columns.push({ id: "SerialNumber", name: "Serial", field: "SerialNumber", sortable: true });
    columns.push({ id: "Material", name: "Material", field: "Material", width: 120, sortable: true });
    columns.push({ id: "Description", name: "Description", field: "Description", width: 260, sortable: true });
    columns.push({ id: "CalDue", name: "CalDue", field: "CalDue", sortable: true });
    columns.push({ id: "CalDueStatus", name: "Status", field: "CalDueStatus", width: 60, formatter: Slick.Formatters.CalDue, sortable: true },);
    columns.push({ id: "Comment", name: "Comment", field: "Comment", width: 60, sortable: true },);
    columns.push({ id: "LatestCalDate", name: "Latest CalDate", field: "LatestCalDate", sortable: true });
    columns.push({ id: "SafetyDue", name: "SafetyDue", field: "SafetyDue", sortable: true });
    columns.push({ id: "LatestSafetyDate", name: "Latest SafetyDate", field: "LatestSafetyDate", sortable: true });
    columns.push({ id: "CalInterval", name: "Cal Interval", field: "CalInterval", sortable: true });
    columns.push({ id: "CalPlace", name: "Cal Place", field: "CalPlace", sortable: true });
    columns.push({ id: "StoreLocation", name: "Store Location", field: "StoreLocation", sortable: true });
    columns.push({ id: "SystemStatus", name: "System Status", field: "SystemStatus", sortable: true });
    columns.push({ id: "UserStatus", name: "User Satus", field: "UserStatus", sortable: true });
    columns.push({ id: "Room", name: "Room", field: "Room", sortable: true });
    columns.push({ id: "SuperordEquip", name: "SuperordEquip", field: "SuperordEquip", sortable: true });
    columns.push({ id: "SortField", name: "SortField", field: "SortField", sortable: true });
    columns.push({ id: "Machine", name: "Machine", field: "Machine", sortable: true });
    columns.push({ id: "ToolkitMachine", name: "ToolkitMachine", field: "ToolkitMachine", sortable: true });
    columns.push({ id: "ToolkitSloc", name: "ToolkitSloc", field: "ToolkitSloc", sortable: true });
    columns.push({ id: "InCal", name: "InCal", field: "InCal", sortable: true });
    columns.push({ id: "NeedCal", name: "NeedCal", field: "NeedCal", sortable: true });
    columns.push({ id: "NeedSafety", name: "NeedSafety", field: "NeedSafety", sortable: true });
    columns.push({ id: "PSN", name: "PSN", field: "PSN", sortable: true });


  

    options = {
        columnPicker: {
            columnTitle: "Columns",
            hideForceFitButton: false,
            hideSyncResizeButton: false,
            forceFitTitle: "Force fit columns",
            syncResizeTitle: "Synchronous resize",
        },
        editable: true,
        enableAddRow: false,
        enableCellNavigation: true,
        asyncEditorLoading: true,
        forceFitColumns: false,
        enableColumnReorder: true,
        topPanelHeight: 25,
        showHeaderRow: true,
        headerRowHeight: 30,
        explicitInitialization: true
    };

    dataView = new Slick.Data.DataView({ inlineFilters: true });

    grid = new Slick.Grid("#myGrid", dataView, columns, options);
    grid.setSelectionModel(new Slick.RowSelectionModel({ selectActiveRow: false }));
    grid.registerPlugin(checkboxSelector);

    grid.onClick.subscribe(function (e, args) {
        // debugger;
        currentSelectedRow = args.row
    });

    grid.onHeaderRowCellRendered.subscribe(function (e, args) {
        let columnId = args.column.id;
        let cell = $(args.node);
        //if (columnId === "Plant") return;
        if (columnId === "id") return;
        if (columnId === "CalDue") return;
        if (columnId === "LatestCalDate") return;
        cell.empty();
        if (columnId === "_checkbox_selector") {
            // let lb = $(document.createTextNode("C"));
            // $(document.createElement("Button"))
            //     .attr("id", "clrChk")
            //     .append(lb)
            //     .appendTo(cell);
            // $(cell).css("Font", "xx-small")
            //     .css("background-color", "blue");
            return;
        }

        $(document.createElement("input"))
            .attr("type", "text")
            .attr("id", columnId)
            .data("columnId", columnId)
            //          .val(columnFilters[args.column.id])
            .val(filterValues.texts[columnId])
            // .css("background-color", "grey")
            .appendTo(cell);
        headerRowInputIds.push(columnId);
    });

    grid.onSort.subscribe(function (e, args) {
        var comparer = function (a, b) {
            return (a[args.sortCol.field] > b[args.sortCol.field]) ? 1 : -1;
        }
        dataView.sort(comparer, args.sortAsc);
    });
    $(grid.getHeaderRow()).japaneseInputChange('input[type=text]', filterValChanged);

    pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));
    columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);


    grid.init();

    dataView.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
    });

    dataView.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
    });


    $.get(host + "/ToolInventories/GetData").then(
        function (ans) {
            console.log("Data received ");
            let length = ans.length;

            data = ans;
            //add :id to each row
            for (let index = 0; index < length; index += 1) {
                let d = data[index];
                d['id'] = index;
            }


            // execute following code after setup
            // initialize the model after all the events have been hooked up
            checkDuedate(data);
            dataView.beginUpdate();
            dataView.setItems(data, "id");
            dataView.setFilterArgs(filterValues);
            dataView.setFilter(myFilter);
            dataView.endUpdate();

            dataView.syncGridSelection(grid, true);
            showNumber();
            updateDropdownList();

            // $("#gridContainer").resizable();
        },

        function (jqXHR, textStatus, err) {
            console.error("Error Hapened");
            $('#NumShowing').text("Error");
            $('#NumTotal').text(textStatus);
        }
    );

    /*
    checkDuedate(data);

    dataView.beginUpdate();
    dataView.setItems(data, "sid");
    dataView.setFilterArgs(filterValues);
    dataView.setFilter(myFilter);
    dataView.endUpdate();
    dataView.syncGridSelection(grid, true);

    showNumber();
    updateDropdownList();
    */
});