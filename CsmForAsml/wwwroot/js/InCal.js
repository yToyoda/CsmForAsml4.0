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

$(function () {
    "use strict";

    let grid;
    let data = [];
    let dataView;
    let oData;
    let currentRow;
    let currentRowIndex;
    let selected = [];
    let copiedSelected = [];
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
    let dateFieldNames = ["RegisteredDate", "UserShipDate", "VenReceiveDate", "CalDate", "PlanedShipDate",
        "VenShipDate", "UserReceiveDate", "CcReceiveDate", "CcUploadDate"];
    let dateFieldNamesJP = ["登録日", "ASML発送日", "受領日", "校正実施日", "予定出荷日", "返送出荷日", "ASML受領日", "証明書受領日", "証明書登録日"];
    let dlprIndex, dlprDate;       //return value from dialog pannel
    let dlprCalResult, dlprComment; //return value from dialog pannel
    let filterValues = {
        texts: {},
        selection: null,
        dateFrom: null,
        dateTo: null,
        dateUndef: false,
        dateIndex: 1
    };

    let updateList = []; // List of date / event update, notify to host
    let returnDate, returnId;


    connection.start().then(function () {
        console.log('Now connected, connection ID=' + connection.connectionId);
        this_connectionId = connection.connectionId
    }).catch(function (err) {
        return console.error(err.toString());
    });

    connection.on("LatestCalCert", function (filename) {
        if (filename === null || filename === "") {
            alert("保存されている校正証明書はありませんでした");
        } else {
            window.open(host + "/CalHistory/ShowPdf/" + filename);
        }
    });

    connection.on("PInfoSaved", function () {
        alert("変更をデータベースに保存しました");
    });

    let stage;
    let dialogPInfo = $('#dp-productInfo');
    let dialogObj = $('#dialog-pannel');
    let dialogObj2 = $('#dialog-pannel2');
    let dialogCalResult = $('#dp-calResult');

    let returnvalue;

    let dialogButtons = [
        {
            text: "キャンセル",
            click: function () {
                // returnvalue = null
                returnvalue = "Cancel";
                $(this).dialog("close");
            }
        },
        {
            text: "Ok",
            width: 150,
            click: function () {
                // $('#return-value').text(returnId + " : " + returnDate);
                returnvalue = "OK";
                $(this).dialog("close");
            }
        },
    ]

    let dpPinfoButtons = [
        {
            text: "キャンセル",
            click: function () {
                returnvalue = "Cancel";
                $(this).dialog("close");
            }
        },
        {
            text: "Save",
            width: 150,
            click: function () {
                returnvalue = "OK";
                $(this).dialog("close");
            }
        },
    ]

    const validateAndSave = function () {
        let changed = false;
        let serchanged = false;
        if ($('#PMaker').val() != currentRow.PMaker) {
            currentRow.PMaker = $('#PMaker').val();
            changed = true;
        }
        if ($('#PModel').val() != currentRow.PModel) {
            currentRow.PModel = $('#PModel').val();
            changed = true;
        }
        if ($('#PName').val() != currentRow.PName) {
            currentRow.PName = $('#PName').val();
            changed = true;
        };
        if ($('#PSerial').val() != currentRow.PSN) {
            currentRow.PSN = $('#PSerial').val();
            serchanged = true;
        };
        if (changed || serchanged) {
            dataView.updateItem(currentRow.Id, currentRow);
            dataView.refresh();
            let post_data = {
                connectionId: this_connectionId,
                Id: currentRow.Id,
                Serial: currentRow.SerialNumber,
                Material: currentRow.Material,
                PMaker: currentRow.PMaker,
                PModel: currentRow.PModel,
                PName: currentRow.PName,
                PSerial: currentRow.PSN,
                ChangedP: changed,
                ChangedS: serchanged
            };

            // 受け取り側 C#のクラスのProperty名と一致した Property名を付けること
            // そうしないと、C#側で受け取りのパラメータに null が渡る
            postToHost(host + "/CalInProcesses/SavePInfo", post_data)
        }
    };

    //  stage　を判定するための配列
    let stageDates = {
        0: [false, , , , , , , ,],                // ０ASML 発送日  
        1: [true, false, , , , , , ,],　　　       // 1 Vendor 受領日
        2: [true, true, false, , , , , ,],        // 2 校正日
        3: [true, true, true, , false, , , ,],    // 3 Vendor 発送日
        4: [true, true, true, , true, false, , ,],  // 4 asml 受領日
        5: [true, true, true, , , , false, ,],      // 5 CC 受領日
    }

    //  stage 毎に　Dialog の入力を enable する Mask 
    let enArray = {
        0: [1, 0, 0, 0, 0, 0, 0, 1],
        1: [0, 1, 1, 1, 0, 0, 1, 2],
        2: [0, 1, 1, 1, 0, 0, 2, 3],
        3: [0, 1, 1, 1, 0, 0, 3, 5],
        4: [1, 0, 0, 0, 1, 0, 4, 6],
        5: [1, 1, 1, 1, 1, 1, 5, 7],
    }

    dialogPInfo.dialog({
        dialogClass: "customdiag-aqua",
        buttons: dpPinfoButtons,
        modal: true,
        show: { effect: "blind", duration: 100 },
        autoOpen: false,
        width: 600,
    })

    dialogObj.dialog({
        dialogClass: "customdiag-aqua",
        buttons: dialogButtons,
        modal: true,
        show: { effect: "blind", duration: 100 },
        autoOpen: false,
        width: 500,
    })

    dialogObj2.dialog({
        dialogClass: "customdiag-aqua",
        buttons: dialogButtons,
        modal: true,
        show: { effect: "blind", duration: 100 },
        autoOpen: false,
        width: 500,
    })

    dialogCalResult.dialog({
        dialogClass: "customdiag-aqua",
        buttons: dialogButtons,
        modal: true,
        show: { effect: "blind", duration: 100 },
        autoOpen: false,
        width: 500,
    })




    const judgeStage = function (arow) {
        let inPat = [];
        let st = 0;
        let match;
        for (let i = 1; i < 9; i += 1) {
            inPat[i] = Boolean(arow[dateFieldNames[i]]);
        }
        for (st = 0; st < 6; st += 1) {
            match = true;
            for (let i = 0; i < 8; i += 1) {
                if (stageDates[st][i] !== undefined && stageDates[st][i] !== null)
                    if (inPat[i + 1] !== stageDates[st][i]) match = false;
            }
            if (match) {
                return st;
            }
        }
        return 5;
    }


    const myFilter = function (item, args) {
        let datenames = ['RegisteredDate', 'UserShipDate', 'VenReceiveDate', 'CalDate', 'PlanedShipDate',
            'VenShipDate', 'UserReceiveDate', 'CcReceiveDate', 'CcUploadDate'];

        if (!(item)) return false;
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

        let datestr = item[datenames[args.dateIndex]];
        if (args.dateUndef) {
            if (datestr !== undefined && datestr !== null && datestr !== "") { return false; }
        } else {
            if (args.dateFrom !== null && (!(datestr) || moment(datestr, "YYYY/MM/DD").isBefore(args.dateFrom, "day"))) {
                return false;
            }
            if (args.dateTo !== null && (!(datestr) || moment(datestr, "YYYY/MM/DD").isAfter(args.dateTo, "day"))) {
                return false;
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
    }

    const getAllSelectedRowIndexes = function () {   // work with global var oData , selected
        copyselection();  // add selected items to array
        // check selected row and push to selected
        oData = dataView.getItems();
        let indexes = [];
        for (let ind = oData.length - 1; ind >= 0; ind -= 1) {
            if (oData[ind].sel) {
                indexes.push(ind);
            }
        }
        return indexes;
    }

    const getAllSelectedRows = function () {   // work with global var oData , selected
        copyselection();  // add selected items to array
        // check selected row and push to selected
        oData = dataView.getItems();
        let rows = [];
        for (let ind = 0; ind < oData.length; ind += 1) {
            if (oData[ind].sel) {
                rows.push(oData[ind]);
            }
        }
        return rows;
    }

    const testFilter = function (item, args) {
        // date filters
        let datenames = ['RegisteredDate', 'UserShipDate', 'VenReceiveDate', 'CalDate', 'PlanedShipDate',
            'VenShipDate', 'UserReceiveDate', 'CcReceiveDate', 'CcUploadDate'];

        let datestr = item[datenames[args.dateIndex]];
        if (args.dateUndef) {
            if (datestr !== undefined && datestr !== null && datestr !== "") { return false; }
        } else {
            if (args.dateFrom !== null && ((!datestr) || moment(datestr, "YYYY/MM/DD").isBefore(args.dateFrom, "day"))) {
                return false;
            }
            if (args.dateTo !== null && ((!datestr) || moment(datestr, "YYYY/MM/DD").isAfter(args.dateTo, "day"))) {
                return false;
            }
        }

    }

    const updateFilter = function () {
        copyselection();
        //testFilter(dataView.getItem(0), filterValues)
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
        //let m = moment("2020-05-15"); // for debug
        return m.date(1).add(monthoffset, "month");
    };

    const showNumber = function () {
        let totalNumber = data.length;
        let showing = dataView.getLength();
        $('#NumShowing').text(showing);
        $('#NumTotal').text(totalNumber);
    }

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
        clearDateFromTo();
        $('input[name="date1Radio"]:radio').val([0]);
        $('input[name="tab_item"]:radio').val([1]);
        filterValues.dateFrom = null;
        filterValues.dateTo = null;
        filterValues.dateUndef = false;
    }

    const clearDateFromTo = function () {
        $("#date1From").val(null);
        $("#date1From").css('background-color', 'white');
        $("#date1To").val(null);
        $("#date1To").css('background-color', 'white');
    }


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
    }

    const prepareDialog = function (stg) {
        let sw = enArray[`${stg}`];
        for (let i = 0; i < 6; i += 1) {
            let yesno = false;
            if (sw[i] === 1) yesno = true;
            $(`#r${i}`).prop('disabled', !yesno);
            $(`#rr${i}`).prop('disabled', !yesno);
        }
        $(`#r${sw[6]}`).prop('checked', true);
        $(`#rr${sw[6]}`).prop('checked', true);
        returnId = sw[6];
        return sw[7];
    }


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
        let arow;
        let oData = dataView.getItems();
        for (let x of oData) {
            x.sel = false;
        }
        grid.setSelectedRows(selectedrows);
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
        filterValues.selection = null;
        $('input[name="filBySel"]:radio').val([0]);  //    

        delete filterValues.texts;
        filterValues.texts = {}; // re new texts        
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

    //name="tab_item"
    $('input[name="tab_item"]:radio').change(function () {
        let x = Number($(this).val());
        filterValues.dateIndex = x;
        selectListReloadLevel = 0;
        updateFilter();
    });




    $('input[name="date1Radio"]:radio').change(function () {
        let date1FilterSel = $(this).val();
        switch (date1FilterSel) {
            case "0":
                filterValues.dateFrom = null;
                filterValues.dateTo = null;
                filterValues.dateUndef = false;
                clearDateFromTo();
                break;
            case "1":
                filterValues.dateFrom = null;
                filterValues.dateTo = null;
                filterValues.dateUndef = true;
                clearDateFromTo();
                break;
            case "2":
                filterValues.dateFrom = firstDay(0);
                filterValues.dateTo = firstDay(1);  // moment() is today
                filterValues.dateUndef = false;
                clearDateFromTo();
                break;
            case "3":
                filterValues.dateFrom = firstDay(-1); // 1st day of last month
                filterValues.dateTo = firstDay(0);
                filterValues.dateUndef = false;
                clearDateFromTo();
                break;
            case "4":
                break;

        }
        selectListReloadLevel = 0;
        updateFilter();
    });

    $('#date1From').on('change', function () {
        let dateinput = $(this).val()
        filterValues.dateFrom = moment(dateinput, "YYYY/MM/DD");
        let $btn = $('input#cdr3');
        // $('#cdr0').prop('checked', false);
        // $('#cdr1').prop('checked', false);
        // $('#cdr2').prop('checked', false);
        $('input[name="date1Radio"]:radio').val([4]);
        $("#date1From").css('background-color', 'aquamarine');
        $('#date1To').datepicker('option', 'minDate', new Date(dateinput));
        filterValues.dateUndef = false;
        selectListReloadLevel = 0;
        updateFilter();
    });

    $("#date1To").on("change", function () {
        let dateinput = $(this).val();
        filterValues.dateTo = moment(dateinput, "YYYY/MM/DD");
        $('#cdr0').prop('checked', false);
        $('#cdr1').prop('checked', false);
        $('#cdr2').prop('checked', false);
        $('input[name="date1Radio"]:radio').val([4]);
        $("#date1To").css('background-color', 'aquamarine');
        $('#date1From').datepicker('option', 'maxDate', new Date(dateinput));
        filterValues.dateUndef = false;
        selectListReloadLevel = 0;
        updateFilter();
    });

    $('input[name="dlprd1"]:radio').change(function () {
        dlprIndex = $(this).val();
        $('#dlpDateLabel1').text(dateFieldNamesJP[dlprIndex]);
    });

    $('input[name="dlprd2"]:radio').change(function () {
        dlprIndex = $(this).val();
        $('#dlpdi2').val(currentRow[dateFieldNames[dlprIndex]] || "")
        $('#dlpDateLabel2').text(dateFieldNamesJP[dlprIndex]);
        if (dlprIndex === "3") { // 校正実施日
            showCalResult2();
            $('#calRes2').css('display', 'block');
        } else {
            $('#calRes2').css('display', 'none');
        }

    });

    const showCalResult2 = function () {
        $('#dlpCalResult2').val("--");
        if (currentRow.CalResultString != "") {
            $('#dlpCalResult2').val(currentRow.CalResultString);
        }
        //if (currentRow.VenComment) {
        $('#dlpcci2').text(currentRow.VenComment);
        //}
    }

    const showCalResult = function () {
        $('#dlpCalResult').val("--");
        if (currentRow.CalResultString != "") {
            $('#dlpCalResult').val(currentRow.CalResultString);
        }
        //$('#calResultComm').text("");
        $('#calResultComm').text(currentRow.VenComment);
    }

    // events from fnkey area

    $('#fnkey1').click(function () {
        // download Excel file
        let totalNumber = data.length;
        let idNumberList = [];
        let arow;
        selected = getAllSelectedRowIndexes()
        for (let ind of selected) {
            arow = oData[ind];
            idNumberList.push(arow.Id);
        };
        if (idNumberList.length > 0) {
            let post_data = {
                IdNums: idNumberList
            };
            // 受け取り側 C#のクラスのProperty名と一致した Property名を付けること
            // そうしないと、C#側で受け取りのパラメータに null が渡る
            postToHost(host + "/CalInProcesses/Download", post_data, receiveFilename)
        } else {
            alert("Download する行に ✔ を入れてから、このボタンを押してください");
        };
    });

    const receiveFilename = function (ret) {
        let filename = ret.responseJSON;
        let url = host + "/CalInProcesses/ShowExcel?Filename=" + filename;
        window.open(url, "ExcelWindow");
    }

    $('#fnkey2').click(function () {
        //<button id="fnkey2">Cal History</button>

        if (currentSelectedRow != null) {
            currentRow = grid.getDataItem(currentSelectedRow);
            currentRowIndex = dataView.getIdxById(currentRow.Id);
            window.open(host + "/CalHistory/History/" + currentRow.SerialNumber + "?ConId=" + this_connectionId);
        }
    });

    // "HistoryFinished"
    $('#fnkey3').click(function () {
        //<button id="fnkey3">Latest Cal Cert</button>        
        let stat;
        if (currentSelectedRow != null) {
            currentRow = grid.getDataItem(currentSelectedRow);
            currentRowIndex = dataView.getIdxById(currentRow.Id);
            //stat = window.open(host + "/CalHistory/LatestCalCert/" + arow.SerialNumber + "?ConId=" + this_connectionId);
            $.get(host + "/CalHistory/LatestCalCert/" + currentRow.SerialNumber + "?ConId=" + this_connectionId);
            return;
        }
        return;
    });


    const postToHost = function (urlto, post_data, completeFunction) {
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
            complete: completeFunction,
        });
    }

    const allSameStage = function () {
        let date0 = [];
        let match;
        match = true;
        for (let ind of selected) {
            let x = oData[ind];
            if (date0.length === 0) {
                for (let i = 1; i < 9; i += 1) {
                    date0[i] = Boolean(x[dateFieldNames[i]]);
                }
            } else {
                for (let i = 1; i < 9; i += 1) {
                    if (date0[i] !== Boolean(x[dateFieldNames[i]])) {
                        match = false;
                        return match;
                    };
                }
            }
        }
        return match;
    }

    const selectChecked = function () {
        filterValues.selection = true;
        $('input[name="filBySel"]:radio').val([1]);  //        
        updateFilter();
    }


    $('#dlpdi1').change(function () {
        dlprDate = $(this).val();
    });



    $('#dlpdi2').change(function () {
        dlprDate = $(this).val();
    });



    $('#fnkey4').click(function () {
        // enter product information
        if (currentSelectedRow != null) {
            currentRow = grid.getDataItem(currentSelectedRow);
            currentRowIndex = dataView.getIdxById(currentRow.Id);
            //$('<p>' + arow.SerialNumber + '</p>').appendTo('#lblSerial');
            $('#lblSerial').text('ASML 管理番号: ' + currentRow.SerialNumber);
            $('#lblMaterial').text('Material 番号: ' + currentRow.Material);
            if (currentRow.PMaker == null) currentRow.PMaker = "";
            if (currentRow.PModel == null) currentRow.PModel = "";
            if (currentRow.PName == null) currentRow.PName = "";
            if (currentRow.PSN == null) currentRow.PSN = "";
            $('#PMaker').val(currentRow.PMaker);
            $('#PModel').val(currentRow.PModel);
            $('#PName').val(currentRow.PName);
            $('#PSerial').val(currentRow.PSN);
            dialogPInfo.dialog('open');
        }
    });

    $('#fnkey5').click(function () {
        // test routine for dataView.getItem(ind);        
        let arow;
        selected = getAllSelectedRowIndexes()   // selected は選択された行のオリジナルデータの　index の配列
        copiedSelected = selected;
        let n = selected.length;
        let ind;
        updateList = [];  // initialize updateList
        if (n === 0) {
            // warning for nothing is selected
            alert("変更したい行をチェックしてから、このボタンを押してください"); // or confirm (OK, Cancel)
            return;
        } else if (n === 1) {
            initiateDialog();
        } else {
            if (allSameStage()) {
                // apply entered to all selected equipment
                selectChecked();
                stage = judgeStage(oData[selected[0]]);
                dlprIndex = prepareDialog(stage);
                $('#dlpDateLabel1').text(dateFieldNamesJP[dlprIndex]);;
                $('#dateInput').val("");
                dialogObj.dialog('open');
                // save entered data
            } else {
                initiateDialog();
            }
        }
        // dialogObj2.dialog('open');
    });

    $('#fnkey6').click(function () {
        //<button id="fnkey6">完了設定</button>
    });


    const initiateDialog = function () {
        if (copiedSelected.length > 0) {
            currentRowIndex = copiedSelected.shift();
            showDiag2(currentRowIndex);
        } else {
            // send updateList to host server
            let post_data = {
                UpdateList: updateList
            };
            postToHost(host + "/CalInProcesses/SaveChanges", post_data, updateComplete)
        }
    }

    const showDiag2 = function (index) {
        currentRow = oData[index];
        stage = judgeStage(currentRow);
        let ind = prepareDialog(stage);
        // if (stage === 2) { $('#calRes2').css('display','block')}
        $('#dlpSerial').text("Serial : " + currentRow.SerialNumber);
        for (let i = 1; i <= 3; ++i) {
            $('#dlpdl' + i).text(currentRow[dateFieldNames[i]] || "");
        }
        for (let i = 4; i <= 6; ++i) {
            $('#dlpdl' + i).text(currentRow[dateFieldNames[i + 1]] || "");
        }
        $('#dlpdi2').val(currentRow[dateFieldNames[ind]] || "")

        dlprIndex = ind;
        $('input[name="dlprd1"]:radio').val(dlprIndex);

        // if (ind === 2) { $('#calRes2').css('display', 'block') }
        $('#dlpDateLabel2').text(dateFieldNamesJP[dlprIndex]);
        if (dlprIndex == 3) { // 校正実施日
            showCalResult2();
            $('#calRes2').css('display', 'block');
        } else {
            $('#calRes2').css('display', 'none');
        }

        $('#dlpDateLabel').text(dateFieldNamesJP[ind]);
        dialogObj2.dialog('open');
    };

    const showDpCalResult = function (index) {
        currentRow = oData[index];
        //    currentRowIndex = dataView.getIdxById(currentRow.Id);
        //$('<p>' + arow.SerialNumber + '</p>').appendTo('#lblSerial');
        $('#lblcrSerial').text('Serial: ' + currentRow.SerialNumber);
        $('#caldateIn').text('校正実施日: ' + currentRow.CalDate);
        if (currentRow.CalResult) {
            $('#calResult3').val(currentRow.CalResult);
        } else {
            $('#calResult3').val("--");
        }
        $('#calResultComm').text(currentRow.VenComment);

        dialogCalResult.dialog('open');
    }

    
    dialogObj.on('dialogclose', function () {
        let stg, indate;   
        let update;
        if (returnvalue === "OK") {
            stg = dateFieldNames[dlprIndex];
            indate = $('#dlpdi1').val();
            
            for (let i of selected) {
                update = {StageNum: dlprIndex, EventDate: indate};
                let arow = dataView.getItemByIdx(i);
                arow[stg] = indate;
                let index = arow.Id;
                dataView.updateItem(arow.Id, arow);　
                if (stg !== "CalDate") {
                    update.Id = arow.Id;
                    updateList.push(update);
                }
            }
            if (stg === "CalDate") {
                // input cal results
                if (copiedSelected.length > 0) {
                    index = copiedSelected.shift();
                    showDpCalResult(index);
                }
            } else {
                // send updateList to host server
                let post_data = {
                    UpdateList: updateList
                };
                postToHost(host + "/CalInProcesses/SaveChanges", post_data, updateComplete)

            }

        }
    });

    dialogCalResult.on('dialogclose', function () {
        if (returnvalue === "OK") {
            // store entered result into updateList
            // currentRow
            currentRow.CalResult = $('#calResult3').val();
            currentRow.VenComment = $('#calResultComm').text();
            dataView.updateItem(currentRow.Id, currentRow);  // update dataView
            let update = { Id: currentRow.Id, StageNum: 3, EventDate: currentRow.CalDate, CalResult: currentRow.CalResult, Comment: currentRow.VenComment };
            updateList.push(update);
        }
        if (copiedSelected.length > 0) {
            index = copiedSelected.shift();
            showDpCalResult(index);
        } else {
            // send updateList to host server
            let post_data = {
                UpdateList: updateList
            };
            postToHost(host + "/CalInProcesses/SaveChanges", post_data, updateComplete)
        }
    });

    const updateComplete = function (ret) {
        alert("Update が完了しました。")
        // popup or dialog to tell update complete
    }

    dialogObj2.on('dialogclose', function () {
        if (returnvalue === "OK") {
            // store entered result into updateList
            // currentRow is set at showDiag2
            currentRow[dateFieldNames[dlprIndex]] = $('#dlpdi2').val();
            if (dlprIndex === 3) {
                currentRow.VenComment = $('#dlpcci2').text;
                if (currentRow.VenComment === null) currentRow.VenComment = "";

                currentRow.CalResultString = $('#dlpCalResult2').val();
                currentRow.CalResult = null;
                if (currentRow.CalResultString === "GD") {
                    currentRow.CalResult = true;
                } else if (currentRow.CalResultString === "NG") {
                    currentRow.CalResult = false;
                } else if (currentRow.CalResultString === "NOCAL") {
                    if (currentRow.VenComment.indexOf("NoCal") === -1) {
                        currentRow.VenComment = "NoCal:" + currentRow.VenComment;
                    }
                }
            }
            dataView.updateItem(currentRow.Id, currentRow);  // update dataView
            let update = { Id: currentRow.Id, StageNum: dlprIndex, EventDate: currentRow.CalDate };
            if (dlprIndex === 3) {
                update.CalResult = currentRow.CalResult;
                update.Comment = currentRow.VenComment;
            }
            updateList.push(update);
        }
        initiateDialog();
    });


    // main routine execution start from here

    checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel"
    });

    columns.push(checkboxSelector.getColumnDefinition());
    // Filter での扱いを簡単にするために、　id (grid で columnId として扱われる) と field (dataViewでのデータのプロパティ名) を同一にしておくこと
    // Column  id: Date0 から　Date8 は特殊な扱いをしているので例外

    //columns.push({ id: "Id", name: "Id", field: "Id", width: 40, sortable: true });
    columns.push({ id: "Plant", name: "Plant", field: "Plant", width: 40, resizable: true, sortable: true });
    columns.push({ id: "Location", name: "Location", field: "Location", width: 60, resizable: true, sortable: true });
    columns.push({ id: "SerialNumber", name: "Serial", field: "SerialNumber", width: 80, resizable: true, sortable: true });
    columns.push({ id: "Material", name: "Material", field: "Material", width: 120, resizable: true, sortable: true });
    columns.push({ id: "Description", name: "Description", field: "Description", width: 250, resizable: true, sortable: true });
    //    {id: "CalInt", name: "Cal Interval", field: "CalInt"},
    columns.push({ id: "CalPlace", name: "Cal Place", field: "CalPlace", resizable: true, sortable: true });
    columns.push({ id: "Date0", name: "登録日", field: "RegisteredDate", resizable: true, sortable: true });
    columns.push({ id: "Date1", name: "ASML発送日", field: "UserShipDate", resizable: true, sortable: true });
    columns.push({ id: "Date2", name: "受領日", field: "VenReceiveDate", resizable: true, sortable: true });
    columns.push({ id: "Date3", name: "校正実施日", field: "CalDate", resizable: true, sortable: true });
    columns.push({ id: "CalResult", name: "校正結果", field: "CalResultString", width: 60, resizable: true, sortable: true });
    columns.push({ id: "VenComment", name: "コメント", field: "VenComment", width: 120, resizable: true, sortable: true });
    columns.push({ id: "Date4", name: "予定出荷日", field: "PlanedShipDate", resizable: true, sortable: true });
    columns.push({ id: "Date5", name: "返送出荷日", field: "VenShipDate", resizable: true, sortable: true });
    columns.push({ id: "Date6", name: "ASML受領日", field: "UserReceiveDate", resizable: true, sortable: true });
    columns.push({ id: "Date7", name: "証明書受領日", field: "CcReceiveDate", resizable: true, sortable: true });
    columns.push({ id: "Date8", name: "証明書登録日", field: "CcUploadDate", resizable: true, sortable: true });
    columns.push({ id: "Tat", name: "TAT", field: "Tat", resizable: true, sortable: true });
    columns.push({ id: "CalInterval", name: "Cal-Interval", field: "CalInterval", resizable: true, sortable: true });
    columns.push({ id: "PMaker", name: "P.Maker", field: "PMaker", resizable: true, sortable: true });
    columns.push({ id: "PModel", name: "P.Model", field: "PModel", resizable: true, sortable: true });
    columns.push({ id: "PName", name: "P.Name", field: "PName", resizable: true, sortable: true });
    columns.push({ id: "PSN", name: "P.Serial", field: "PSN", resizable: true, sortable: true });

    let selectionListPlant = ["JP01", "JP03", "JP04", "JP05", "JP07"];
    let selectionListCalPlaces = ["TOKYO", "MIYAGI"];


    options = {
        columnPicker: {
            columnTitle: "Columns",
            hideForceFitButton: false,
            hideSyncResizeButton: false,
            forceFitTitle: "Force fit columns",
            syncResizeTitle: "Synchronous resize",
        },
        editable: true,
        enableAddRow: true,
        enableCellNavigation: true,
        asyncEditorLoading: true,
        forceFitColumns: false,
        enableColumnReorder: true,
        enableTextSelectionOnCells: true,
        topPanelHeight: 25,
        showHeaderRow: true,    // この行で表示をオンに
        headerRowHeight: 30,　　//  この行で高さを 30 pixels にする        
        autoHeight: false,
        explicitInitialization: true,
        fullWidthRows: true    // false だと、初期化時に表示されていない Column のフィルター入力が作成されない  
        //True だと隠れていても作成されるる
    };

    headerRowInputIds = [];
    dataView = new Slick.Data.DataView({ inlineFilters: true });
    //dataView = new Slick.Data.DataView();


    grid = new Slick.Grid("#myGrid", dataView, columns, options);
    grid.setSelectionModel(new Slick.RowSelectionModel({ selectActiveRow: false }));
    grid.registerPlugin(checkboxSelector);
    grid.onClick.subscribe(function (e, args) {
        currentSelectedRow = args.row
    });

    grid.onHeaderRowCellRendered.subscribe(function (e, args) {
        let columnId = args.column.id;
        if (columnId === "_checkbox_selector") return;
        // if (columnId === "Plant") return;
        if (columnId === "id" || columnId === "Finished") return;
        if (columnId.indexOf('Date') !== -1) return;
        if (columnId === "CalResult" || columnId === "Tat" || columnId === "CalInterval") return;
        let cell = $(args.node);
        cell.empty();
        let $atr = $(document.createElement("input"))
            .attr("type", "text")
            //  .attr("id", columnId)
            .data("columnId", columnId)
            // .val(columnFilters[args.column.id])
            .val(filterValues.texts[columnId])
            .appendTo(cell);
        headerRowInputIds.push(columnId);
        /*
        grid.onHeaderRowCellRendered.subscribe(function(e, args) {
        $(args.node).empty();
        $("<input type='text'>")
           .data("columnId", args.column.id)
           .val(columnFilters[args.column.id])
           .appendTo(args.node);
    });
         */

    });

    $(grid.getHeaderRow()).japaneseInputChange('input[type=text]', filterValChanged);

    pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));
    columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);

    grid.init();

    grid.onSort.subscribe(function (e, args) {
        var comparer = function (a, b) {
            return (a[args.sortCol.field] > b[args.sortCol.field]) ? 1 : -1;
        }
        dataView.sort(comparer, args.sortAsc);
    });

    dataView.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
    });

    dataView.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
    });



    $.get(host + "/CalInProcesses/GetData").then(
        function (ans) {
            console.log("Data received ");
            let length = ans.length;

            data = ans;
            //add :id to each row
            /*
            for (let index = 0; index < length; index += 1) {
                let d = data[index];
                d['id'] = index;
            }
            */


            // execute following code after setup
            // initialize the model after all the events have been hooked up
            dataView.beginUpdate();
            dataView.setItems(data, "Id");
            dataView.setFilterArgs(filterValues);
            dataView.setFilter(myFilter);
            dataView.endUpdate();

            dataView.syncGridSelection(grid, true);
            showNumber();
            updateDropdownList();
            setDropdownList("#selectPlant", selectionListPlant);
            setDropdownList("#selectCalPlace", selectionListCalPlaces);
            // $("#gridContainer").resizable();
        },

        function (jqXHR, textStatus, err) {
            console.error("Error Hapened");
            $('#NumShowing').text("Error");
            $('#NumTotal').text(textStatus);
        }
    );

});
