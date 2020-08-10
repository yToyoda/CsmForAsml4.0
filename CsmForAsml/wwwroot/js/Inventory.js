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
    $(".datepicker").datepicker();
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

    let filterValues = {
        texts: {},
        selection: null,
        dateFrom: [null, null, null, null],
        dateTo: [null, null, null, null],
    };



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
        let tgt;
        for (let i = 0; i < 4; i++) {
            if (args.dateFrom[i] !== null) {
                tgt = item[`Date${i}`];
                if (!(tgt) || moment(tgt, "YYYY/MM/DD").isBefore(args.dateFrom[i], "day")) return false;
            }
            if (args.dateTo[i] !== null) {
                tgt = item[`Date${i}`];
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
        filterValues.texts['Serial'] = $(this).val();
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

    // events from fnkey area



    // main routine execution start from here

    checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel"
    });

    columns.push(checkboxSelector.getColumnDefinition());


    columns.push({ id: "Plant", name: "Plant", field: "Plant", sortable: true, editor: Slick.Editors.TextNC });
    columns.push({ id: "Serial", name: "Serial", field: "Serial", sortable: true });
    columns.push({ id: "Material", name: "Material", field: "Material", width: 120, sortable: true });
    columns.push({ id: "Description", name: "Description", field: "Description", width: 260, sortable: true });
    columns.push({ id: "Date0", name: "CalDue", field: "Date0", sortable: true });
    columns.push({ id: "CalDueStatus", name: "Status", field: "CalDueStatus", width: 60, formatter: Slick.Formatters.CalDue, sortable: true },);
    //columns.push({ id: "CalDueStatus", name: "Status", field: "CalDueStatus", width: 60, sortable: true },);
    columns.push({ id: "Date1", name: "Latest CalDate", field: "Date1", sortable: true });
    columns.push({ id: "Date2", name: "SafetyDue", field: "Date2", sortable: true });
    columns.push({ id: "Date3", name: "Latest SafetyDate", field: "Date3", sortable: true });
    columns.push({ id: "CalInt", name: "Cal Interval", field: "CalInt", sortable: true });
    columns.push({ id: "CalPlace", name: "Cal Place", field: "CalPlace", sortable: true });
    columns.push({ id: "StoreLoc", name: "Store Location", field: "StoreLoc", sortable: true });
    columns.push({ id: "SysStat", name: "System Status", field: "SysStat", sortable: true });
    columns.push({ id: "UserStat", name: "User Satus", field: "UserStat", sortable: true });
    columns.push({ id: "Room", name: "Room", field: "Room", sortable: true });


    let adata = [
        ["JP01", "1000009977", "4022.502.16143", "TESA DISPLAY UNIT TT10", "2020/03/13", "2021/03/31", "MIYAGI (KT)", "12", "TFLJ", "ESTO", "DEFA", "ZLF04031", "", ""],
        ["JP05", "1000018906", "SERV.453.31162", "LM HOISTING ADAPTOR", "2016/01/28", "2017/01/31", "", "12", "BLCK", "ESTO", "CTRL", "APZ00S", "", ""],
        ["JP04", "1000019146", "SERV.485.22011", "TORQUEWRENCH (10-100NM) 4100-01", "2020/03/24", "2021/03/31", "MIYAGI (KT)", "12", "0003", "ESTO", "USAB", "ALF02011", "", ""],
        ["JP05", "1000019150", "SERV.485.22011", "TORQUEWRENCH (10-100NM) 4100-01", "2020/05/19", "2021/05/31", "MIYAGI (KT)", "12", "CLBR", "ESTO", "INCA TOST", "", "", ""],
        ["JP07", "1000019342", "SERV.489.50876", "WRENCH TORQUE 1/2 20-120NM 6121-1-CT", "2020/02/10", "2021/02/28", "MIYAGI (KT)", "12", "0003", "ESTO", "USAB", "ASD05041", "", ""],
        ["JP05", "1000019760", "SERV.450.92941", "TESA TRONIC TOOL TT10 SET (5X)", "2019/11/14", "2020/11/30", "MIYAGI (KT)", "12", "9801", "ESTO", "USAB TOST", "CLC06021", "", ""],
        ["JP04", "1000020076", "SERV.477.29682", "ATWS MIRRORBLOCK HOIST. INTERF.", "2017/01/16", "2018/01/31", "", "12", "BLCK", "ESTO", "CERT TOST", "BLCK", "", ""],
        ["JP08", "1000021303", "SERV.453.55201", "LEVEL READOUT UNIT", , , "MIYAGI (KT)", "12", "", "ASEQ", "USAB", "TFLJ", "2020/03/26", "2021/03/25"],
        ["JP01", "1000024082", "SERV.488.00621", "PHM TORQUE WRENCH 100 NCM", "2019/11/01", "2020/11/30", "MIYAGI (KT)", "12", "0003", "ESTO", "USAB TOST", "ZLD01041", "", ""],
        ["JP04", "1000024174", "SERV.453.76291", "ADDITION STAND.SERV.TOOLCASE", , , "TOKYO (KT)", "12", "0003", "ESTO", "USAB TOST", "ALF08041", "2019/04/05", "2020/04/04"],
        ["JP05", "1000025729", "SERV.489.50265", "CARRIER PLATE SUCTION PA 80KG", , , "", "12", "0003", "ESTO", "USAB TOST", "CLC10011", "2019/07/23", "2020/07/22"],
        ["JP03", "1000026540", "SERV.483.64772", "LENS TOP TOOL 3 IL AT", "2020/04/17", "2021/04/30", "MIYAGI (KT)", "12", "0003", "ESTO", "USAB TOST", "ATF01021", "", ""],
        ["JP05", "1000026726", "SERV.450.31891", "SPIRIT LEVEL 100H01 80X16 FLAT", "2019/07/08", "2020/07/31", "MIYAGI (KT)", "12", "Cust", "ECUS ESTO", "USAB TOST", "", "", ""],
        ["JP04", "1000026727", "SERV.450.31891", "SPIRIT LEVEL 100H01 80X16 FLAT", "2020/02/12", "2021/02/28", "MIYAGI (KT)", "12", "0003", "ESTO", "USAB TOST", "ALF03031", "", ""],
        ["JP04", "1000027394", "SERV.450.31891", "SPIRIT LEVEL 100H01 80X16 FLAT", "2019/07/08", "2020/08/31", "MIYAGI (KT)", "12", "0003", "ESTO", "USAB TOST", "ALF03031", "", ""],
        ["JP05", "1000027554", "SERV.483.61091", "MAN TEMPTUNE CALIBRATION KIT", , , " New", "12", "0003", "ESTO", "USAB TOST", "CLB08021", "2020/04/23", "2021/04/22"],
        ["JP04", "1000027556", "SERV.483.61091", "MAN TEMPTUNE CALIBRATION KIT", , , "New", "12", "0003", "ESTO", "USAB TOST", "ALE02031", "2020/06/30", "2021/06/29"],
        ["JP07", "1000027793", "SERV.436.56352", "PRESS. METER MONOX P10000 SET", "2020/05/07", , "TOKYO (KT)", "12", "PEND", "ESTO", "DEFA TOST", "PEND", "", ""],
        ["JP05", "1000027816", "SERV.453.76291", "ADDITION STAND.SERV.TOOLCASE", , , "TOKYO (KT)", "12", "0003", "ESTO", "USAB", "CLC08011", "2020/07/01", "2021/06/30"],
        ["JP05", "1000028116", "SERV.477.29682", "ATWS MIRRORBLOCK HOIST. INTERF.", , , "", "12", "0003", "ESTO", "USAB", "CPB04M", "2019/05/15", "2020/05/14"],
        ["JP07", "1000028964", "SERV.502.28286", "PDT TOOL", , , "MIYAGI (KT)", "12", "0003", "ESTO", "USAB TOST", "HPD01M", "2019/06/03", "2020/06/02"],
        ["JP01", "1000030218", "SERV.502.29150", "WATER CONDUCTIVITY METER SET", "2019/07/18", "2020/07/31", "TOKYO (KT)", "12", "Cust", "ECUS ESTO", "USAB TOST", "", "", ""],
        ["JP07", "1000030369", "SERV.453.76291", "ADDITION STAND.SERV.TOOLCASE", , , "TOKYO (KT)", "12", "0003", "ESTO", "USAB", "ASD02011", "", ""],
        ["JP03", "1000032085", "SERV.477.33172", "PRESS. TESTER FLOW AIRSHOWERS", "2020/01/21", , "TOKYO (KT)", "12", "0005", "ESTO", "DEFA TOST", "ATH01S", "", ""],
        ["JP07", "1000032272", "SERV.436.58543", "TESA TT 20 DISPL UNIT 110/230V", "2020/03/06", "2021/03/31", "MIYAGI (KT)", "12", "0003", "ESTO", "USAB TOST", "ASC03021", "", ""],
        ["JP07", "1000032424", "SERV.488.00621", "PHM TORQUE WRENCH 100 NCM", "2019/07/08", "2020/07/31", "MIYAGI (KT)", "12", "0003", "ESTO", "USAB TOST", "ASE01031", "", ""],
        ["JP04", "1000033293", "SERV.477.33172", "PRESS. TESTER FLOW AIRSHOWERS", "2020/04/16", "2021/04/30", "TOKYO (KT)", "12", "0005", "ESTO", "DEFA TOST", "DEFECT", "", ""],
        ["JP04", "1000033312", "SERV.453.13731", "TORQUE WRENCH 4-20NM PUSH-ON", , , "MIYAGI (KT)", "12", "0003", "ESTO", "USAB", "ALF03041", "", ""],
        ["JP01", "1000033402", "SERV.477.33181", "FLOW TESTER AIR SYSTEM", "2019/06/13", "2020/06/30", "TOKYO (KT)", "12", "0003", "ESTO", "USAB TOST", "ZLC01021", "", ""],
        ["JP05", "1000033403", "SERV.477.33181", "FLOW TESTER AIR SYSTEM", , , "TOKYO (KT)", "12", "0003", "ESTO", "USAB", "CLA04031", "", ""],
        ["JP07", "1000033404", "SERV.477.33181", "FLOW TESTER AIR SYSTEM", , , "TOKYO (KT)", "12", "CLBR", "ESTO", "INCA TOST", "CLBR", "", ""],
        ["JP05", "1000034386", "SERV.502.28208", "ADJUSTABLE SPIRIT LEVEL", "2020/03/10", "2021/03/31", "MIYAGI (KT)", "12", "9801", "ESTO", "USAB TOST", "CLC06041", "", ""],
        ["JP04", "1000034387", "SERV.502.28208", "ADJUSTABLE SPIRIT LEVEL", "2020/03/06", "2021/03/31", "MIYAGI (KT)", "12", "0003", "ESTO", "USAB TOST", "ALF09031", "", ""],
        ["JP03", "1000035820", "4022.502.15499", "TESA PROBE GT31 032.10802", "2019/10/04", "2020/10/31", "MIYAGI (KT)", "12", "0003", "ESTO", "USAB TOST", "ATC02031", "", ""],
        ["JP05", "1000035859", "SERV.436.58543", "TESA TT 20 DISPL UNIT 110/230V", "2020/05/19", "2021/05/31", "MIYAGI (KT)", "12", "CLBR", "ESTO", "INCA TOST", "", "", ""],
    ];

    let d0 = moment();
    let d1 = firstDay(1);
    let d2 = firstDay(2);
    let caldue;

    for (let i = 0; i < adata.length; i += 1) {
        data[i] = {
            sid: i,
            Plant: adata[i][0], Material: adata[i][2], Description: adata[i][3], Serial: adata[i][1],
            Date0: adata[i][5], Date1: adata[i][4], CalInt: adata[i][7], CalPlace: adata[i][6], StoreLoc: adata[i][8],
            SysStat: adata[i][9],
            UserStat: adata[i][10],
            Room: adata[i][11],
            Date2: adata[i][13], Date3: adata[i][12],
        }
        // check cal due and generate CalDueStatus
        caldue = moment(data[i].Date0, "YYYY/MM/DD");
        if (caldue.isBefore(d0, "day")) {
            data[i].CalDueStatus = "OverDue";
        } else if (caldue.isBefore(d1, "day")) {
            data[i].CalDueStatus = "Due TM";
        } else if (caldue.isBefore(d2, "day")) {
            data[i].CalDueStatus = "Due NM";
        } else data[i].CalDueStatus = "";
    };

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

    // grid.onClick.subscribe(function (e, cell) {
    //     let x = e;
    //     let y = cell;
    // })

    dataView.beginUpdate();
    dataView.setItems(data, "sid");
    dataView.setFilterArgs(filterValues);
    dataView.setFilter(myFilter);
    dataView.endUpdate();
    dataView.syncGridSelection(grid, true);

    showNumber();
    updateDropdownList();
});