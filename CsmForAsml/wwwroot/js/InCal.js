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
    let columns = [];
    let checkboxSelector;
    let pager;
    let columnpicker;
    let options;
    let selectListReloadLevel = 0;
    let headerRowInputIds = [];
    let dlprIndex, dlprDate;       //return value from dialog pannel
    let dlprCalResult, dlprComment; //return value from dialog pannel

    let filterValues = {
        texts: {},
        selection: null,
        dateFrom: null,
        dateTo: null,
        dateUndef: false,
        dateIndex: 'Date1'
    };

    let returnDate, returnId;

    let stage;

    let dialogObj = $('#dialog-pannel');

    let dialogButtons = [
        {
            text: "キャンセル",
            // icon: "ui-icon-cancel",
            click: function () {
                // returnvalue = null
                $(this).dialog("close");
            }
        },
        {
            text: "Ok",
            width: 150,
            // icon: "ui-icon-heart",
            click: function () {
                // returnvalue = "OK";
                // $('#return-value').text(returnId + " : " + returnDate);
                $(this).dialog("close");
            }
        },
    ]

    let dialogObj2 = $('#dialog-pannel2');


    let enArray = {
        0: [1, 0, 0, 0, 0, 0, 0, 1],
        1: [0, 1, 1, 1, 0, 0, 1, 2],
        2: [0, 1, 1, 1, 0, 0, 2, 3],
        3: [0, 1, 1, 1, 0, 0, 3, 5],
        4: [1, 0, 0, 0, 1, 0, 4, 6],
        5: [1, 1, 1, 1, 1, 1, 5, 7],
    }

    let stageDates = {
        0: [false, , , , , , , ,],
        1: [true, false, , , , , , ,],
        2: [true, true, false, , , , , ,],
        3: [true, true, true, , false, , , ,],
        4: [true, true, true, , true, false, , ,],   // asml 受領日
        5: [true, true, true, , , , false, ,],　　//  CC 受領日
    }

    dialogObj.dialog({
        dialogClass: "customdiag-aqua",
        buttons: dialogButtons,
        modal: true,
        show: { effect: "blind", duration: 100 },
        autoOpen: false,
        width: 400,
    })

    dialogObj2.dialog({
        // dialogClass: "customdiag-aqua",
        buttons: dialogButtons,
        modal: true,
        show: { effect: "blind", duration: 100 },
        autoOpen: false,
        width: 400,
    })

    const judgeStage = function (arow) {
        let inPat = [];
        let st = 0;
        let match;
        for (let i = 1; i < 9; i += 1) {
            inPat[i] = Boolean(arow[`Date${i}`])
        }
        for (st = 0; st < 6; st += 1) {
            match = true;
            for (let i = 0; i < 8; i += 1) {
                if (stageDates[st][i] !== null && stageDates[st][i] !== undefined)
                    if (inPat[i + 1] !== stageDates[st][i]) match = false;
            }
            if (match) {
                return st;
            }
        }
        return 5;
    }


    const myFilter = function (item, args) {
        // by selection
        if (args.selection !== null) {
            if (args.selection !== item.sel) {
                return false;
            }
        }
        // text filters        
        for (let columnId in args.texts) {
            if (columnId !== undefined && args.texts[columnId] !== "") {
                let val = item[columnId];  // in order to this statement work, keep 'id:' is equal to 'field:' in column definition
                if (val === undefined || val.toUpperCase().indexOf(args.texts[columnId]) === -1) {
                    return false;
                }
            }
        }
        // date filters

        let datestr = item[args.dateIndex];
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

    const getAllSelectedRows = function () {   // work with global var oData , selected
        copyselection();  // add selected items to array
        // check selected row and push to selected
        oData = dataView.getItems();
        let sela = [];
        for (let ind = oData.length - 1; ind >= 0; ind -= 1) {
            if (oData[ind].sel) {
                sela.push(ind);
            }
        }
        return sela;
    }

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
            serialList[aRow.Serial] = true;
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
        filterValues.texts['Serial'] = $(this).val();
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
        filterValues.dateIndex = `Date${x}`
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


    // events from fnkey area

    $('#button1').click(function () {
        // test routine for dataView.getItem(ind);
        let nShowing = dataView.getLength();
        let aRow;
        aRow = dataView.getItemByIdx(3);
        for (let i = 0; i < nShowing; i += 1) {
            aRow = dataView.getItem(i);
        }
        var selectedrows = grid.getSelectedRows();
    });

    const allSameStage = function () {
        let date0 = [];
        let match;
        match = true;
        for (let ind of selected) {
            let x = oData[ind];
            if (date0.length === 0) {
                for (let i = 1; i < 9; i += 1) {
                    date0[i] = Boolean(x[`Date${i}`]);
                }
            } else {
                for (let i = 1; i < 9; i += 1) {
                    if (date0[i] !== Boolean(x[`Date${i}`])) {
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

    $('input[name="dlprd1"]:radio').change(function () {
        dlprIndex = $(this).val();
    });

    $('#dlpdi1').change(function () {
        dlprDate = $(this).val();
    });

    $('input[name="dlprd2"]:radio').change(function () {
        dlprIndex = $(this).val();
        $('#dlpdi2').val(currentRow[`Date${dlprIndex}`] || "")
    });

    $('#dlpdi2').change(function () {
        dlprDate = $(this).val();
    });


    const showDiag2 = function (index) {
        currentRow = oData[index];
        stage = judgeStage(currentRow);
        let ind = prepareDialog(stage);
        $('#dlpSerial').text("Serial : " + currentRow.Serial);
        $('#dlpdl1').text(currentRow[`Date${1}`] || "");
        $('#dlpdl2').text(currentRow[`Date${2}`] || "");
        $('#dlpdl3').text(currentRow[`Date${3}`] || "");
        $('#dlpdl4').text(currentRow[`Date${5}`] || "");
        $('#dlpdl5').text(currentRow[`Date${6}`] || "");
        $('#dlpdl6').text(currentRow[`Date${7}`] || "");
        $('#dlpdi2').val(currentRow[`Date${ind}`] || "")
        dlprIndex = ind;
        dialogObj2.dialog('open');
    }

    $('#button4').click(function () {
        // test routine for dataView.getItem(ind);        
        let arow;
        selected = getAllSelectedRows()
        let n = selected.length;
        let ind;
        if (n === 0) {
            // warning for nothing is selected
            alert("変更したい行をチェックしてから、このボタンを押してください"); // or confirm (OK, Cancel)
            return;
        } else if (n === 1) {
            currentRowIndex = selected.pop();
            showDiag2(currentRowIndex);

        } else {
            if (allSameStage()) {
                // apply entered to all selected equipment
                selectChecked();
                stage = judgeStage(oData[selected[0]]);
                let ind = prepareDialog(stage);
                $('#dateInput').val("");
                dialogObj.dialog('open');
                // save entered data
            } else {
                if (selected.length > 0) {
                    let ind = selected.pop();
                    showDiag2(ind);
                }
            }
        }


        // dialogObj2.dialog('open');

    });

    dialogObj2.on('dialogclose', function () {
        // how to update datagrid on slickgrid
        let x = dataView.getItemByIdx(currentRowIndex)
        x[`Date${dlprIndex}`] = dlprDate;
        dataView.updateItem(currentRowIndex, x);
        // dataView.refresh();
        if (selected.length > 0) {
            let ind = selected.pop();
            showDiag2(ind);
        }
    });


    // main routine execution start from here

    checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel"
    });

    columns.push(checkboxSelector.getColumnDefinition());
    // columns.push({ id: "Sel", name: "Select", width: 80, minWidth: 20, maxWidth: 80, field: "Select", formatter: Slick.Formatters.Checkmark, editor: Slick.Editors.Checkbox, cannotTriggerInsert: true, sortable: true },);
    // columns.push({ id: "id", name: "ID", field: "cid", width: 40, sortable: true, editor: Slick.Editors.TextNC });
    columns.push({ id: "Plant", name: "Plant", field: "Plant", width: 40, resizable: true, sortable: true, editor: Slick.Editors.TextNC });
    columns.push({ id: "SerialNumber", name: "Serial", field: "SerialNumber", width: 80, resizable: true, sortable: true, editor: Slick.Editors.TextNC });
    columns.push({ id: "Material", name: "Material", field: "Material", width: 120, resizable: true, sortable: true, editor: Slick.Editors.TextNC });
    columns.push({ id: "Description", name: "Description", field: "Description", width: 250, resizable: true, sortable: true, editor: Slick.Editors.TextNC });
    //    {id: "CalInt", name: "Cal Interval", field: "CalInt"},
    columns.push({ id: "CalPlace", name: "Cal Place", field: "CalPlace", resizable: true, sortable: true });
    columns.push({ id: "Date0", name: "登録日", field: "RegisteredDate", resizable: true, sortable: true });
    columns.push({ id: "Date1", name: "ASML発送日", field: "UserShipDate", resizable: true, sortable: true });
    columns.push({ id: "Date2", name: "受領日", field: "VenReceiveDate", resizable: true, sortable: true });
    columns.push({ id: "Date3", name: "校正実施日", field: "CalDate", resizable: true, sortable: true });
    columns.push({ id: "CalResult", name: "校正結果", field: "CalResult", width: 60, resizable: true, sortable: true });
    columns.push({ id: "Comments", name: "コメント", field: "VenComment", width: 120, resizable: true, sortable: true, editor: Slick.Editors.Text });
    columns.push({ id: "Date4", name: "予定出荷日", field: "PlanedShipDate", resizable: true, sortable: true });
    columns.push({ id: "Date5", name: "返送出荷日", field: "VenShipDate", resizable: true, sortable: true });
    columns.push({ id: "Date6", name: "ASML受領日", field: "UserReceiveDate", resizable: true, sortable: true });
    columns.push({ id: "Date7", name: "証明書受領日", field: "CcReceiveDate", resizable: true, sortable: true });
    columns.push({ id: "Date8", name: "証明書登録日", field: "CcUploadDate", resizable: true, sortable: true });
    columns.push({ id: "Tat", name: "TAT", field: "Tat", resizable: true, sortable: true });
    columns.push({ id: "Comp", name: "完了", field: "Comp", resizable: true, sortable: true });


    let adata = [
        ["JP05", "Yokkaichi", "1000093228", "SERV.473.00813", "WRENCH TORQUELDR 35-350CNM,1/4", "MIYAGI (KT)", "12", "2020/04/03", "", "", , , , , , , , , , "False"],
        ["JP05", "Yokkaichi", "1000086194", "SERV.644.09033", "NT WS LA2LOS SENSOR ADJ TOOL", "MIYAGI (KT)", "12", "2020/04/03", "2020/04/02", , , , "", , , , , , "3", "False"],
        ["JP05", "Yokkaichi", "1000124798", "SERV.483.40151", "ANGULAR TORQUE WRENCH 0.5 NM", "TOKYO (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/03", "2020/04/09", "GD", "", "2020/04/13", "2020/04/10", "2020/04/13", , , "5", "False"],
        ["JP05", "Yokkaichi", "1000050454", "SERV.502.28286", "PDT TOOL", "MIYAGI (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/06", , "GD", "", , , , , , "5", "False"],
        ["JP05", "Yokkaichi", "1000051646", "SERV.489.50841", "WRENCH TORQUE 1/4  1 - 12NM", "MIYAGI (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/06", "2020/04/07", "GD", "", "2020/04/14", "2020/04/09", "2020/04/13", "2020/04/27", "2020/04/30", "3", "True"],
        ["JP05", "Yokkaichi", "1000301412", "SERV.502.17054", "TSI VELOCICALC METER", "TOKYO (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/03", "2020/04/17", "GD", "", "2020/05/08", "2020/05/14", "2020/05/15", , , "29",],
        ["JP05", "Yokkaichi", "1000311633", "SERV.639.18104", "LEAK TEST TOOL", "MIYAGI (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/06", "2020/04/13", "GD", "", "2020/04/14", "2020/04/13", "2020/04/14", "2020/04/27", "2020/04/30", "5", "True"],
        ["JP05", "Yokkaichi", "1000320795", "SERV.502.28208", "ADJUSTABLE SPIRIT LEVEL", "MIYAGI (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/06", "2020/04/08", "GD", "", "2020/04/14", "2020/04/09", "2020/04/13", "2020/04/27", "2020/04/30", "3", "True"],
        ["JP05", "Yokkaichi", "1000228963", "SERV.502.16552", "WRENCH TORQUE 1/4 20-120 CNM", "MIYAGI (KT)", "24", "2020/04/03", "2020/04/02", "2020/04/06", "2020/04/07", "GD", "", "2020/04/14", "2020/04/09", "2020/04/13", "2020/04/27", "2020/04/30", "3", "True"],
        ["JP03", "Yamagata", "1000237090", "SERV.502.16552", "WRENCH TORQUE 1/4 20-120 CNM", "MIYAGI (KT)", "24", "2020/04/06", "2020/04/06", "2020/04/07", "2020/04/08", "GD", "", "2020/04/15", "2020/04/09", "2020/04/10", "2020/04/27", "2020/04/30", "2", "True"],
        ["JP04", "Fukuoka", "1000057157", "SERV.502.16524", "LTT MAIN ASSY 1400", "MIYAGI (KT)", "12", "2020/04/08", "2020/04/08", "2020/04/10", "2020/04/10", "NG", "指示の器差において、指示範囲±50㎛・±500㎛とも　全て測定値が規格外れ。", "2020/04/20", "2020/04/14", "2020/04/15", "2020/04/27", "2020/04/30", "2", "True"],
        ["JP04", "Fukuoka", "1000033293", "SERV.477.33172", "PRESS. TESTER FLOW AIRSHOWERS", "TOKYO (KT)", "12", "2020/04/08", "2020/04/08", "2020/04/09", "2020/04/16", "NG", "精度外れ", "2020/04/23", "2020/04/22", "2020/04/23", "2020/04/22", "2020/04/28", "9", "True"],
        ["JP05", "Yokkaichi", "1000185610", "SERV.489.50182", "TORQUE WRENCH 2-25 NM 9X12", "MIYAGI (KT)", "12", "2020/04/14", "2020/04/14", "2020/04/16", "2020/04/16", "GD", "", "2020/04/24", "2020/04/20", "2020/04/22", , , "2",],
        ["JP05", "Yokkaichi", "1000281604", "SERV.489.50182", "TORQUE WRENCH 2-25 NM 9X12", "MIYAGI (KT)", "12", "2020/04/14", "2020/04/14", "2020/04/16", "2020/04/16", "NG", "20.0N･ｍ,40.0N･ｍ部が規格±5％に対し、+8.25％+9.0％。", "2020/04/24", "2020/04/20", "2020/04/22", , , "2",],
        ["JP04", "Fukuoka", "1000276154", "SERV.646.88341", "CROWCON C02 SNIFFER", "TOKYO (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/16", "2020/04/22", "NG", "CO2項目において規格を外れている", "2020/04/28", "2020/04/27", "2020/04/28", "2020/04/28", "2020/04/28", "7", "True"],
        ["JP03", "Yamagata", "1000026540", "SERV.483.64772", "LENS TOP TOOL 3 IL AT", "MIYAGI (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/16", "2020/04/17", "GD", "", "2020/04/24", "2020/04/21", "2020/04/22", , , "3",],
        ["JP04", "Fukuoka", "1000042037", "SERV.483.25714", "ATWS REFERENCE HEIGHT BLOCK", "MIYAGI (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/17", "2020/04/17", "GD", "", "2020/04/27", "2020/04/21", "2020/04/22", , , "2",],
        ["JP04", "Fukuoka", "T1842", "4022.502.15487", "BUBBLE LEVEL 200MM 0.02/M", "MIYAGI (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/17", "2020/04/17", "GD", "", "2020/04/27", "2020/04/21", "2020/04/22", , , "2",],
        ["JP03", "Yamagata", "1000393985", "SERV.477.33162", "FLOW TESTER WATER SYSTEM", "MIYAGI (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/16", "2020/04/24", "NG", "精度不良、修理依頼調査したが対応不可の為、返却", "2020/04/24", "2020/05/14", "2020/05/15", , , "20",],
        ["JP04", "Fukuoka", "1000404294", "SERV.502.17054", "TSI VELOCICALC METER", "TOKYO (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/16", "2020/04/29", "GD", "", "2020/05/21", "2020/05/19", "2020/05/20", "2020/05/19", "2020/05/20", "23", "True"],
        ["JP05", "Yokkaichi", "1000454014", "SERV.436.58543", "TESA TT 20 DISPL UNIT 110/230V", "MIYAGI (KT)", "12", "2020/04/16", "2020/04/16", "2020/04/20", "2020/04/21", "GD", "", "2020/04/28", "2020/04/23", "2020/04/27", , , "3",],
        ["JP08", "Kitakami", "1000457000", "SERV.489.53450", "WRENCH TORQUE 1/4 1-5NM", "MIYAGI (KT)", "12", "2020/04/16", "2020/04/16", "2020/04/17", "2020/04/17", "GD", "", "2020/04/27", "2020/04/21", "2020/04/22", , , "2",],
        ["JP05", "Yokkaichi", "1000470896", "SERV.453.10061", "TORQUE WRENCH", "MIYAGI (KT)", "12", "2020/04/16", "2020/04/16", "2020/04/20", "2020/04/21", "GD", "", "2020/04/28", "2020/04/23", "2020/04/27", , , "3",],
        ["JP05", "Yokkaichi", "1000228961", "SERV.502.16552", "WRENCH TORQUE 1/4 20-120 CNM", "MIYAGI (KT)", "24", "2020/04/16", "2020/04/16", "2020/04/20", "2020/04/21", "GD", "", "2020/04/28", "2020/04/23", "2020/04/27", , , "3",],
        ["JP01", "", "1000237070", "SERV.502.16222", "TORQUE WRENCH 10-60 NM", "MIYAGI (KT)", "12", "2020/04/17", "2020/04/17", "2020/04/20", "2020/04/21", "GD", "", "2020/04/28", "2020/04/23", "2020/04/27", , , "3",],
        ["JP01", "", "1000325896", "SERV.659.83071", "MICROMANOMETER MONOX DC100 SET", "TOKYO (KT)", "12", "2020/04/17", "2020/04/17", "2020/04/20", "2020/04/24", "NG", "内部より漏れがあり校正不可", "2020/05/04", "2020/04/27", "2020/04/28", "2020/04/28", "2020/04/28", "5", "True"],
        ["JP07", "Hiroshima", "1000320419", "SERV.450.17621", "TORQUE WRENCH 1-6 NM", "MIYAGI (KT)", "12", "2020/05/22", "2020/05/22", "2020/05/24", "2020/05/27", "GD", "", "2020/06/04", "2020/06/07", "2020/06/11", , , "9",],
        ["JP07", "Hiroshima", "1000223343", "SERV.453.10061", "TORQUE WRENCH", "MIYAGI (KT)", "12", "2020/05/22", "2020/05/22", "2020/05/24", "2020/05/27", "GD", "", "2020/06/04", "2020/06/07", "2020/06/11", , , "9",],
        ["JP07", "Hiroshima", "1000027793", "SERV.436.56352", "PRESS. METER MONOX P10000 SET", "TOKYO (KT)", "12", "2020/05/22", "2020/05/22", "2020/05/23", "2020/06/07", "NG", "オーバー圧により計測不可", "2020/06/07", "2020/06/11", "2020/06/12", "2020/06/12", "2020/06/12", "12", "True"],
        ["JP07", "Hiroshima", "1000036126", "SERV.489.50182", "TORQUE WRENCH 2-25 NM 9X12", "MIYAGI (KT)", "12", "2020/05/22", "2020/05/22", "2020/05/24", "2020/05/27", "GD", "", "2020/06/04", "2020/06/07", "2020/06/11", , , "9",],
        ["JP05", "Yokkaichi", "1000093228", "SERV.473.00813", "WRENCH TORQUELDR 35-350CNM,1/4", "MIYAGI (KT)", "12", "2020/04/03", "", "", , , , , , , , , , "False"],
        ["JP05", "Yokkaichi", "1000086194", "SERV.644.09033", "NT WS LA2LOS SENSOR ADJ TOOL", "MIYAGI (KT)", "12", "2020/04/03", "2020/04/02", , , , "", , , , , , "3", "False"],
        ["JP05", "Yokkaichi", "1000124798", "SERV.483.40151", "ANGULAR TORQUE WRENCH 0.5 NM", "TOKYO (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/03", "2020/04/09", "GD", "", "2020/04/13", "2020/04/10", "2020/04/13", , , "5", "False"],
        ["JP05", "Yokkaichi", "1000050454", "SERV.502.28286", "PDT TOOL", "MIYAGI (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/06", , "GD", "", , , , , , "5", "False"],
        ["JP05", "Yokkaichi", "1000051646", "SERV.489.50841", "WRENCH TORQUE 1/4  1 - 12NM", "MIYAGI (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/06", "2020/04/07", "GD", "", "2020/04/14", "2020/04/09", "2020/04/13", "2020/04/27", "2020/04/30", "3", "True"],
        ["JP05", "Yokkaichi", "1000301412", "SERV.502.17054", "TSI VELOCICALC METER", "TOKYO (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/03", "2020/04/17", "GD", "", "2020/05/08", "2020/05/14", "2020/05/15", , , "29",],
        ["JP05", "Yokkaichi", "1000311633", "SERV.639.18104", "LEAK TEST TOOL", "MIYAGI (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/06", "2020/04/13", "GD", "", "2020/04/14", "2020/04/13", "2020/04/14", "2020/04/27", "2020/04/30", "5", "True"],
        ["JP05", "Yokkaichi", "1000320795", "SERV.502.28208", "ADJUSTABLE SPIRIT LEVEL", "MIYAGI (KT)", "12", "2020/04/03", "2020/04/02", "2020/04/06", "2020/04/08", "GD", "", "2020/04/14", "2020/04/09", "2020/04/13", "2020/04/27", "2020/04/30", "3", "True"],
        ["JP05", "Yokkaichi", "1000228963", "SERV.502.16552", "WRENCH TORQUE 1/4 20-120 CNM", "MIYAGI (KT)", "24", "2020/04/03", "2020/04/02", "2020/04/06", "2020/04/07", "GD", "", "2020/04/14", "2020/04/09", "2020/04/13", "2020/04/27", "2020/04/30", "3", "True"],
        ["JP03", "Yamagata", "1000237090", "SERV.502.16552", "WRENCH TORQUE 1/4 20-120 CNM", "MIYAGI (KT)", "24", "2020/04/06", "2020/04/06", "2020/04/07", "2020/04/08", "GD", "", "2020/04/15", "2020/04/09", "2020/04/10", "2020/04/27", "2020/04/30", "2", "True"],
        ["JP04", "Fukuoka", "1000057157", "SERV.502.16524", "LTT MAIN ASSY 1400", "MIYAGI (KT)", "12", "2020/04/08", "2020/04/08", "2020/04/10", "2020/04/10", "NG", "指示の器差において、指示範囲±50㎛・±500㎛とも　全て測定値が規格外れ。", "2020/04/20", "2020/04/14", "2020/04/15", "2020/04/27", "2020/04/30", "2", "True"],
        ["JP04", "Fukuoka", "1000033293", "SERV.477.33172", "PRESS. TESTER FLOW AIRSHOWERS", "TOKYO (KT)", "12", "2020/04/08", "2020/04/08", "2020/04/09", "2020/04/16", "NG", "精度外れ", "2020/04/23", "2020/04/22", "2020/04/23", "2020/04/22", "2020/04/28", "9", "True"],
        ["JP05", "Yokkaichi", "1000185610", "SERV.489.50182", "TORQUE WRENCH 2-25 NM 9X12", "MIYAGI (KT)", "12", "2020/04/14", "2020/04/14", "2020/04/16", "2020/04/16", "GD", "", "2020/04/24", "2020/04/20", "2020/04/22", , , "2",],
        ["JP05", "Yokkaichi", "1000281604", "SERV.489.50182", "TORQUE WRENCH 2-25 NM 9X12", "MIYAGI (KT)", "12", "2020/04/14", "2020/04/14", "2020/04/16", "2020/04/16", "NG", "20.0N･ｍ,40.0N･ｍ部が規格±5％に対し、+8.25％+9.0％。", "2020/04/24", "2020/04/20", "2020/04/22", , , "2",],
        ["JP04", "Fukuoka", "1000276154", "SERV.646.88341", "CROWCON C02 SNIFFER", "TOKYO (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/16", "2020/04/22", "NG", "CO2項目において規格を外れている", "2020/04/28", "2020/04/27", "2020/04/28", "2020/04/28", "2020/04/28", "7", "True"],
        ["JP03", "Yamagata", "1000026540", "SERV.483.64772", "LENS TOP TOOL 3 IL AT", "MIYAGI (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/16", "2020/04/17", "GD", "", "2020/04/24", "2020/04/21", "2020/04/22", , , "3",],
        ["JP04", "Fukuoka", "1000042037", "SERV.483.25714", "ATWS REFERENCE HEIGHT BLOCK", "MIYAGI (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/17", "2020/04/17", "GD", "", "2020/04/27", "2020/04/21", "2020/04/22", , , "2",],
        ["JP04", "Fukuoka", "T1842", "4022.502.15487", "BUBBLE LEVEL 200MM 0.02/M", "MIYAGI (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/17", "2020/04/17", "GD", "", "2020/04/27", "2020/04/21", "2020/04/22", , , "2",],
        ["JP03", "Yamagata", "1000393985", "SERV.477.33162", "FLOW TESTER WATER SYSTEM", "MIYAGI (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/16", "2020/04/24", "NG", "精度不良、修理依頼調査したが対応不可の為、返却", "2020/04/24", "2020/05/14", "2020/05/15", , , "20",],
        ["JP04", "Fukuoka", "1000404294", "SERV.502.17054", "TSI VELOCICALC METER", "TOKYO (KT)", "12", "2020/04/15", "2020/04/15", "2020/04/16", "2020/04/29", "GD", "", "2020/05/21", "2020/05/19", "2020/05/20", "2020/05/19", "2020/05/20", "23", "True"],
        ["JP05", "Yokkaichi", "1000454014", "SERV.436.58543", "TESA TT 20 DISPL UNIT 110/230V", "MIYAGI (KT)", "12", "2020/04/16", "2020/04/16", "2020/04/20", "2020/04/21", "GD", "", "2020/04/28", "2020/04/23", "2020/04/27", , , "3",],
        ["JP08", "Kitakami", "1000457000", "SERV.489.53450", "WRENCH TORQUE 1/4 1-5NM", "MIYAGI (KT)", "12", "2020/04/16", "2020/04/16", "2020/04/17", "2020/04/17", "GD", "", "2020/04/27", "2020/04/21", "2020/04/22", , , "2",],
        ["JP05", "Yokkaichi", "1000470896", "SERV.453.10061", "TORQUE WRENCH", "MIYAGI (KT)", "12", "2020/04/16", "2020/04/16", "2020/04/20", "2020/04/21", "GD", "", "2020/04/28", "2020/04/23", "2020/04/27", , , "3",],
        ["JP05", "Yokkaichi", "1000228961", "SERV.502.16552", "WRENCH TORQUE 1/4 20-120 CNM", "MIYAGI (KT)", "24", "2020/04/16", "2020/04/16", "2020/04/20", "2020/04/21", "GD", "", "2020/04/28", "2020/04/23", "2020/04/27", , , "3",],
        ["JP01", "", "1000237070", "SERV.502.16222", "TORQUE WRENCH 10-60 NM", "MIYAGI (KT)", "12", "2020/04/17", "2020/04/17", "2020/04/20", "2020/04/21", "GD", "", "2020/04/28", "2020/04/23", "2020/04/27", , , "3",],
        ["JP01", "", "1000325896", "SERV.659.83071", "MICROMANOMETER MONOX DC100 SET", "TOKYO (KT)", "12", "2020/04/17", "2020/04/17", "2020/04/20", "2020/04/24", "NG", "内部より漏れがあり校正不可", "2020/05/04", "2020/04/27", "2020/04/28", "2020/04/28", "2020/04/28", "5", "True"],
        ["JP07", "Hiroshima", "1000320419", "SERV.450.17621", "TORQUE WRENCH 1-6 NM", "MIYAGI (KT)", "12", "2020/05/22", "2020/05/22", "2020/05/24", "2020/05/27", "GD", "", "2020/06/04", "2020/06/07", "2020/06/11", , , "9",],
        ["JP07", "Hiroshima", "1000223343", "SERV.453.10061", "TORQUE WRENCH", "MIYAGI (KT)", "12", "2020/05/22", "2020/05/22", "2020/05/24", "2020/05/27", "GD", "", "2020/06/04", "2020/06/07", "2020/06/11", , , "9",],
        ["JP07", "Hiroshima", "1000027793", "SERV.436.56352", "PRESS. METER MONOX P10000 SET", "TOKYO (KT)", "12", "2020/05/22", "2020/05/22", "2020/05/23", "2020/06/07", "NG", "オーバー圧により計測不可", "2020/06/07", "2020/06/11", "2020/06/12", "2020/06/12", "2020/06/12", "12", "True"],
        ["JP07", "Hiroshima", "1000036126", "SERV.489.50182", "TORQUE WRENCH 2-25 NM 9X12", "MIYAGI (KT)", "12", "2020/05/22", "2020/05/22", "2020/05/24", "2020/05/27", "GD", "", "2020/06/04", "2020/06/07", "2020/06/11", , , "9",]

    ];


    for (var i = 0; i < adata.length; i++) {
        // let x, y;
        data[i] = {
            cid: i,
            //  _checkbox_selector: true, 
            sel: false,
            Plant: adata[i][0], Serial: adata[i][2], Material: adata[i][3], Description: adata[i][4],
            CalPlace: adata[i][5], CalInt: adata[i][6],
            Date0: adata[i][7], Date1: adata[i][8], Date2: adata[i][9], Date3: adata[i][10],
            CalResult: adata[i][11], Comments: adata[i][12], Date4: adata[i][13],
            Date5: adata[i][14], Date6: adata[i][15], Date7: adata[i][16], Date8: adata[i][17], Tat: adata[i][18], Comp: adata[i][19],
        };

    }

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
        topPanelHeight: 25,
        showHeaderRow: true,    // この行で表示をオンに
        headerRowHeight: 30,　　//  この行で高さを 30 pixels にする        
        autoHeight: false,
        explicitInitialization: true,
        fullWidthRows: true
    };

    headerRowInputIds = [];
    dataView = new Slick.Data.DataView({ inlineFilters: true });
    //dataView = new Slick.Data.DataView();


    grid = new Slick.Grid("#myGrid", dataView, columns, options);
    grid.setSelectionModel(new Slick.RowSelectionModel({ selectActiveRow: false }));
    grid.registerPlugin(checkboxSelector);

    grid.onHeaderRowCellRendered.subscribe(function (e, args) {
        let columnId = args.column.id;
        if (columnId === "_checkbox_selector") return;
        // if (columnId === "Plant") return;
        if (columnId === "id") return;
        if (columnId.indexOf('Date') !== -1) return;
        let cell = $(args.node);
        cell.empty();
        let $atr = $(document.createElement("input"))
            .attr("type", "text")
            .attr("id", columnId)
            .data("columnId", columnId)
            // .val(columnFilters[args.column.id])
            .val(filterValues.texts[columnId])
            .appendTo(cell);
        headerRowInputIds.push(columnId);
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

    let host = window.location.protocol + "//" + window.location.host;

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
    /*
    dataView.beginUpdate();
    dataView.setItems(data, "cid");
    dataView.setFilterArgs(filterValues);
    dataView.setFilter(myFilter);
    dataView.endUpdate();
    dataView.syncGridSelection(grid, true);

    setDropdownList("#selectPlant", selectionListPlant);
    setDropdownList("#selectCalPlace", selectionListCalPlaces);

    $('#date1From').datepicker({ numberOfMonths: 3 });
    $('#date1To').datepicker({ numberOfMonths: 3 });
    showNumber();
    updateDropdownList();
    */
});
