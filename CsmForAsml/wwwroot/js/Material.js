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
        dateFrom: null,
        dateTo: null
    };

    let d0 = moment();

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

        if (args.dateFrom !== null) {
            tgt = item['ChangeDate'];
            if (!(tgt) || moment(tgt, "YYYY/MM/DD").isBefore(args.dateFrom, "day")) return false;
        }
        if (args.dateTo !== null) {
            tgt = item['ChangeDate'];
            if (!(tgt) || moment(tgt, "YYYY/MM/DD").isAfter(args.dateTo, "day")) return false;
        }
        return true;
    }


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

    const updateFilter = function () {
        copyselection();
        dataView.setFilterArgs(filterValues);
        dataView.refresh();
        restoreSelection();
        showNumber();
        // updateDropdownList();
    };

    const updateDropdownList = function () {
        let calPlaceList = {};
        let calPlaceA = [];
        let nShowing = dataView.getLength();
        let aRow;

        if (!(filterValues.texts.CalPlace)) {
            for (let i = 0; i < nShowing; i += 1) {
                aRow = dataView.getItem(i);
                calPlaceList[aRow.CalPlace] = true;
            }
            for (let c in calPlaceList) {
                calPlaceA.push(c);
            }
            calPlaceA.sort();
            setDropdownList("#selectCalPlace", calPlaceA);
        }

        let list = ["True", "False"]
        setDropdownList('#selectNeedCal', list);
        setDropdownList('#selectSafety', list);
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
        $('input[name="rdCalDue"]:radio').val([0]);
        $('input[name="rdCalDate"]:radio').val([0]);
        $('input[name="rdSDue"]:radio').val([0]);
        $('input[name="rdSDate"]:radio').val([0]);
        $('input[name="tab_item"]:radio').val([1]);

        clearDateFromTo(0);
        filterValues.dateFrom = null;
        filterValues.dateTo = null;
    }

    const clearDateFromTo = function (index) {
        let id1 = `#din${index}`;
        $(id1 + 'From').val(null);
        $(id1 + 'From').css('background-color', 'white');
        $(id1 + 'To').val(null);
        $(id1 + 'To').css('background-color', 'white');
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

    $(window).on('resize', function () {
        grid.resizeCanvas();
        grid.render();
    });

    // events from ".filterPannel #b1"

    $("#selectCalPlace").on("change", function () {
        let pl = $(this).val().toUpperCase();
        filterValues.texts['CalPlace'] = pl;
        selectListReloadLevel = 1;
        updateFilter();
    });

    $("#selectNeedCal").on("change", function () {
        filterValues.texts['NeedCal'] = $(this).val().toUpperCase();
        selectListReloadLevel = 2;
        updateFilter();
    });

    $("#selectSafety").on("change", function () {
        filterValues.texts['NeedSafety'] = $(this).val().toUpperCase();
        selectListReloadLevel = 2;
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


    $('#din0From').on('change', function () {
        let dateinput = $(this).val()
        filterValues.dateFrom = moment(dateinput, "YYYY/MM/DD");
        $('input[name="rdCalDue"]:radio').val([4]);
        $("#din0From").css('background-color', 'aquamarine');
        $('#din0To').datepicker('option', 'minDate', new Date(dateinput));
        selectListReloadLevel = 0;
        updateFilter();
    });

    $("#din0To").on("change", function () {
        let dateinput = $(this).val();
        filterValues.dateTo = moment(dateinput, "YYYY/MM/DD");
        $('input[name="rdCalDue"]:radio').val([4]);
        $("#din0To").css('background-color', 'aquamarine');
        $('#din0From').datepicker('option', 'maxDate', new Date(dateinput));
        selectListReloadLevel = 0;
        updateFilter();
    });


    // events from fnkey area



    // main routine execution start from here

    checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel"
    });

    columns.push(checkboxSelector.getColumnDefinition());
    //'Material','Material_Description','Cal_Place','Cal_Vendor','Cal_Interval','Instruction'
    //,'ChangeDate','NeedCal','NeedSafety','Safety_Interval','P_Maker','P_Name','P_Model','AddRemove']
    //columns.push({ id: "id", name: "ID", field: "cid", width: 40, sortable: true, editor: Slick.Editors.Text });
    columns.push({ id: "Material", name: "Material", field: "Material", width: 120, sortable: true });
    columns.push({ id: "Description", name: "Description", field: "Description", width: 260, sortable: true });
    columns.push({ id: "CalPlace", name: "Cal Place", field: "CalPlace", sortable: true });
    columns.push({ id: "CalVendor", name: "Cal Vendor", field: "CalVendor", sortable: true });
    columns.push({ id: "Instruction", name: "Instruction", field: "Instruction", sortable: true });
    columns.push({ id: "ChangeDate", name: "ChangeDate", field: "ChangeDate", sortable: true });
    columns.push({ id: "NeedCal", name: "NeedCal", field: "NeedCal", sortable: true });
    columns.push({ id: "NeedSafety", name: "NeedSafety", field: "NeedSafety", sortable: true });
    columns.push({ id: "CalInt", name: "Cal Interval", field: "CalInt", sortable: true });
    columns.push({ id: "SafetyInt", name: "Safety Interval", field: "SafetyInt", sortable: true });
    columns.push({ id: "PMaker", name: "P.Maker", field: "PMaker", sortable: true });
    columns.push({ id: "PName", name: "P.Name", field: "PName", sortable: true });
    columns.push({ id: "PModel", name: "P.Model", field: "PModel", sortable: true });
    columns.push({ id: "Status", name: "Status", field: "Status", sortable: true });


    let adata = [
        // ["Material", "Material_Description", "Cal_Place", "Cal_Vendor", "Cal_Interval", "Instruction", "ChangeDate", "NeedCal", "NeedSafety", "Safety_Interval", "P_Maker", "P_Name", "P_Model", "AddRemove"],
        ["4022.489.50260", 'MUTIMETER DIG FLUKE DIG 177', "TOKYO (KT)", "NEC MP", 12, "", "2018/11/08", "TRUE", "FALSE", "", "FLUKE", "Multimeter", "177", ""],
        ["4022.502.15302", 'TESA SENSOR GT 21', "MIYAGI (KT)", "Sunsea", 12, "表示機とセット校正", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Probes", "GT21(32.10904）", ""],
        ["4022.502.15429", 'HELIUM LEAKAGE DETECTOR', "TOKYO (KT)", "エドワーズ㈱", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["4022.502.15487", 'BUBBLE LEVEL 200MM 0.02/M', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "E.D.A", "Clinometer", "0.2mm/m 4sec", ""],
        ["4022.502.15499", 'TESA PROBE GT31 032.10802', "MIYAGI (KT)", "Sunsea", 12, "表示機とセット校正", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Probes", "GT31D(32.10802)", ""],
        ["4022.502.15605", 'TORQUE WRENCH 3/8" 6-60 NM', "MIYAGI (KT)", "Sunsea", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", ""],
        ["4022.502.16143", 'TESA DISPLAY UNIT TT10', "MIYAGI (KT)", "Sunsea", 12, "プローブとセット校正", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Electrical　Comparator", "TT10（44.30008）", ""],
        ["4022.632.87685", 'VHX-700FE', "MIYAGI (KT)", "Sunsea", 12, "ソフト一式要", "2016/07/08", "TRUE", "FALSE", "", "", "", "", ""],
        ["4022.632.8768X", 'IH MICROSCOPIC TOOL', "NY", "", 12, "", "2016/07/08", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.428.06962", 'TESA PROBE GT21 032.10904', "MIYAGI (KT)", "Sunsea", 12, "表示機とセット校正", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Probes", "GT21（32.10904）", ""],
        ["SERV.428.71482", 'FORCE METER AMETEK 0-150 N', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "AMETEK", "FORCE METER", "LN-150", ""],
        ["SERV.431.59361", 'MINI-DREMOMETER SET(Driver set)', "MIYAGI (KT)", "Sunsea", 24, "", "2017/04/17", "TRUE", "FALSE", "", "GEDORE", "TORQUE WRENCH", "753-01", ""],
        ["SERV.435.70251", 'HYDRAULIC JACK SYSTEM', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.435.76291", 'ADDITION STAND,SERV,TOOLCASE', "", "NEC MP", , "", "2018/11/08", "FALSE", "FALSE", "", "", "", "", ""],
        ["SERV.435.78191", 'FORCE GAUGE 10 N', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.435.78411", 'MOUNTING CARRY ASSY BX50', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.435.80581", 'SAFETY HOOK', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.435.80792", 'HANDLING TOOL RETICLE TABLE', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.435.81012", 'TORQUE WRENCH SET 60 NM', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "Torque Wrench", "6290-1CT", ""],
        ["SERV.436.56351", 'PRESS. METER MONOX P10000 SET', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "ELKA", "MICRO MANOMETER", "PM25", ""],
        ["SERV.436.56352", 'PRESS. METER MONOX P10000 SET', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.436.58543", 'TESA TT 20 DISPL UNIT 110/230V', "MIYAGI (KT)", "Sunsea", 12, "プローブとセット校正", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.436.59681", 'POWER SUPPLY DELTA ES030-5', "MIYAGI (KT)", "Sunsea", 12, "", "2016/07/10", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.436.67361", 'LASERSTAR', "SG", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.436.67375", 'POWER MEASURING SET', "SG", "", 18, "", "2017/04/17", "TRUE", "FALSE", "", "OPHIR", "LASERSTAR", "LASERSTAR", ""],
        ["SERV.437.16131", 'OPHIR TERMOPILE WL', "SG", "", 24, "", "2017/04/17", "TRUE", "FALSE", "", "OPHIR", "Optical Power Sensor", "30A-ASM", ""],
        ["SERV.439.60108", 'RING HST SWVL STL-NP M8-0.5T (2X)', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.439.60504", 'EYE BOLT HST SST M8-140KG', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.439.64091", 'SHACKLE BOW BLT STL-NP 19-3.25T', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.439.64141", 'RING HST SWVL STL-NP M10-0.55T', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.439.64151", 'RING HST SWVL STL-NP M12-1.3T', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.439.64161", 'HST SWVL STL-NP M16-2.4T', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.450.09011", 'TESA GT/25/GT61 (MODIFIED)', "MIYAGI (KT)", "Sunsea", 12, "表示器とセット校正", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Probes", "S32.2011 8D", ""],
        ["SERV.450.09021", 'TESA GT 21 (MODIFIED)', "MIYAGI (KT)", "Sunsea", 12, "表示器とセット校正", "2016/07/10", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.450.09101", 'REFERENCE HEIGHT BLOCK', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "ASML", "REFERENCE HEIGHT BLOCK", "SEV.450.09101", ""],
        ["SERV.450.17611", 'FORCE GAUGE 2.5 N', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "CHATILLON", "DIAL, PUSH-PILL GAUGES", "DPP-5N", ""],
        ["SERV.450.17621", 'TORQUE WRENCH 1-6 NM', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "GEDORE", "TORQUE WRENCH", "757-06", ""],
        ["SERV.450.19881", 'FUNCTION GENERATOR', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.450.28611", 'PRESSURE METER THOMMEN', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.450.30811", 'AI BOTTOM Z ADJ. TOOL', "MIYAGI (KT)", "Sunsea", 24, "", "2017/04/17", "TRUE", "FALSE", "", "ASML", "AI BOTTOM Z ADJ. TOOL", "4022.450.3081", ""],
        ["SERV.450.31891", 'SPIRIT LEVEL 100H01 80X16 FLAT', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "E.D.A", "Clinometer", "0.1ｍｍ/ｍ", ""],
        ["SERV.450.34521", 'HIGH POWER OAI I-LINE PROBE', "SG※", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.450.35571", 'TOOL AIRPRESS.LAMP COMPARTMENT', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.450.37951", 'AI LEVEL INDICATOR', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.450.37983", 'EXTENDED LENS HOISTING YOKE', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.450.39641", 'TESA GAUGE GT22', "MIYAGI (KT)", "Sunsea", 12, "表示器とセット校正", "2016/07/10", "TRUE", "FALSE", "", "TESA", "Probes", "GT22 (32.10924)", "Added"],
        ["SERV.450.43971", 'TORQUE WRENCH 0.1-5.6 NM', "MIYAGI (KT)", "Sunsea", 12, "", "2016/07/10", "TRUE", "FALSE", "", "Sturetevant Richmont", "Torque Wrench", "0.1-5.6 Nm", "Added"],
        ["SERV.450.48002", 'HOISTING YOKE REMA LENS', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.450.48453", 'REFERENCE HEIGHT BLOCK SWS', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.450.59381", 'TORQUE WR 10-60 NM 6290-1CT', "MIYAGI (KT)", "Sunsea", 12, "", "2018/11/08", "TRUE", "FALSE", "", "HAZET", "Torque Wrench", "6290-1CT", ""],
        ["SERV.450.70181", 'AI LEVEL PLATE ELL. MIRROR', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.450.70333", 'AIRSHOWER LIFT TOOL', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.450.76862", 'CALIBRATION PLATE', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.450.77931", 'CORN. CUBES ON CHK SERV POS. TL', "TOKYO (KT)", "MEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "ASML", "CRON CUBES ON CHK SERV", "120 mm", ""],
        ["SERV.450.78401", 'AI TOP MOD. ADJ. TOOL', "JPN", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.450.84634", 'CALIBRE RING SET (2X)', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "ASML", "CALIBRE　RING　SET", "19.95㎜", ""],
        ["SERV.450.89301", 'LSM Y-GUIDE TESA TOOL', "MIYAGI (KT)", "Sunsea", 12, "表示器とセット校正", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Probes", "GT21(32.10904)", ""],
        ["SERV.450.92941", 'TESA TRONIC TOOL TT10 SET (5X)', "MIYAGI (KT)", "Sunsea", 12, "プローブとセット校正", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Electrical　Comparator", "TT10（44.30008）", ""],
        ["SERV.453.03503", 'RED LASER TOOL ZA-REF', "新規", "", 3, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.453.07961", 'ELEC. FLOW METER 5-500 ML/MIN', "TOKYO (KT)", "エヌケイエス株式会社", 12, "", "2017/04/17", "TRUE", "FALSE", "", "Agilent Technologies", "Flow Meter", "Veri-Flow500", ""],
        ["SERV.453.10061", 'TORQUE WRENCH', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "TORQUE WRENCH", "6002-CT", ""],
        ["SERV.453.10841", 'LM LOW POWER DETECTOR', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.453.13711", 'TORQUE WRENCH 1-12NM 1/4" SET', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "GEDORE", "TORQUE　WRENCH", "753-11", ""],
        ["SERV.453.13731", 'TORQUE WRENCH 4-20NM PUSH-ON', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "TORQUE　WRENCH", "6282-1CT", ""],
        ["SERV.453.15251", 'HOIST YOKE LENS & COOLER', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.453.21903", 'SWS LSM RY ADJ TESAHOLDER ASSY', "MIYAGI (KT)", "Sunsea", 12, "表示機とセット校正", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Probes", "GT21（32.10904）", ""],
        ["SERV.453.21932", 'SWS LSM RX ADJ.TESAHOLDER ASSY', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.453.31162", 'LM HOISTING ADAPTOR', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.453.35813", 'HOISTING YOKE ZOOM/AXION', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.453.38572", 'TORQUE WRENCH SET AL. BL. LOCK.', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "Torque Wrench", "6290-1CT", ""],
        ["SERV.453.42271", 'LM SERVICE STAIR', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.453.68182", 'EXTERNAL WTS GUIDE', "MIYAGI (KT)", "Sunsea", 12, "（重量物）2日前に要出荷依頼", "2017/04/17", "TRUE", "FALSE", "", "ASML", "EXTERUAL WTS GUIDE", "H00569/SAM ZWENKMAL", ""],
        ["SERV.453.72031", 'TSI VELOCICALC PLUS 8386 METER', "TOKYO (KT)", "トランステック", 12, "", "2018/11/08", "TRUE", "FALSE", "", "TSI Incorporated", "VELOCICALC Plus Air Velocity Meter", "8386", ""],
        ["SERV.453.76281", 'STANDARD SERVICE TOOLCASE', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.453.76291", 'ADDITION STAND.SERV.TOOLCASE', "TOKYO (KT)", "Sunsea, NECMP", 12, "", "2018/07/26", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.453.76801", 'HEIGHT GAUGE PURGEHOOD WS', "MIYAGI (KT)", "Sunsea", 24, "", "2017/04/17", "TRUE", "FALSE", "", "TESA", "HEIGHT GAUGE PURGEHOOD WS", "19.301", ""],
        ["SERV.470.29361", 'SPM FIBER OPTICS TESTTOOL', "SG", "", 36, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.472.37251", 'BONDING TESTTOOL (COMPLETE)', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.472.63193", 'PALM CAP TOOL', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "FLUKE", "TRUE RMS MULTIMETER", "177", ""],
        ["SERV.473.00617", 'SCISSORS LIFT 70KG, 130X160MM', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.473.00813", 'WRENCH TORQUELDR 35-350CNM,1/4', "MIYAGI (KT)", "Sunsea", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.00503", 'WH DOCK TOOL ASSY AT/XT', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.01462", 'SKI RX RY Z ADJUSTMENT TOOL', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Electronic Indicator  (x3)", "Digico 400-700", ""],
        ["SERV.477.02022", 'HOISTING YOKE TOP MODULE IL AT', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.02062", 'ADJUST SET TOP MODULE IL AT (6x)', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.477.03976", 'ATWS SS MODULE HOISTING INTERF', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.03977", 'ATWS SS MODULE HOISTING INTERF', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.04861", 'AIRB. LIFT MEAS. TOOL RS/WS AT', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Probes (×3)", "GT21HP(32.30036)", ""],
        ["SERV.477.17291", 'TORQUE WRENCH 140-760 NM WS', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.18822", 'LIFT TOOL X-BEAM WS AT', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.18823", 'LIFT TOOL CERAMIC X-BEAM WS AT', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.26938", 'ATWS XY MOTOR MOUNTING TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.29682", 'ATWS MIRRORBLOCK HOIST. INTERF.', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.31193", 'HOISTING YOKE REMA UNIT AT', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.32601", 'DOWEL PIN PRIMAIRY SHAFT', "", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.32611", 'DOWEL PIN SECONDARY SHAFT', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.32621", 'DOWEL PIN SECONDARY MEASUREMENT TOOL', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.33161", 'FLOW TESTER WATER SYSTEM', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.33162", 'FLOW TESTER WATER SYSTEM', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.33172", 'PRESS. TESTER FLOW AIRSHOWERS', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "デジタル圧力計", "HMG1-S", ""],
        ["SERV.477.33181", 'FLOW TESTER AIR SYSTEM', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.34252", 'BASEFRAME SHORT LEVEL ASSY', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "WYLER", "ZEROTRONIC", "3/2AK-13-097", ""],
        ["SERV.477.34765", 'WS JACK BRACKETS SET', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.42671", 'GUIDING TOOL LENS COOLER AT/700', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.43201", 'TORQUE WRENCH 1/2" 20-150 NM', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "GEDORE", "TORQUE WRENCH", "4525", ""],
        ["SERV.477.45021", 'TORQUE WRENCH SET 1', "MIYAGI (KT)", "Sunsea", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.45091", 'TORQUE WRENCH SET 2', "MIYAGI (KT)", "Sunsea", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.55803", 'LSY HOIST ADAPTOR RS AT', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.69004", 'JACK ASSY WLL 15 KN', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.74732", 'WH JACK BRACKETS SET', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.76043", 'BEAM SHORT ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.76051", 'LIFTING BRACKET ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.93631", 'ASSY HOIST YOKE STARL 800/1100', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.94251", 'SPM OPTICAL POWER METER TOOL', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.477.95762", 'AWH ROBOT LIFT TOOL ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.97184", 'MB INSTALL BRACKET ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.97185", 'MB INSTALL BRACKET ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.477.98381", 'ATWS SS TESA TOOL ASSY', "MIYAGI (KT)", "Sunsea", 12, "プローブとセット校正", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Electrical　Comparator", "TT10（44.30008）", ""],
        ["SERV.481.31121", 'ULTRASONIC LEAK TESTER', "NL10", "", 24, "", "2017/04/17", "TRUE", "FALSE", "", "SDT", "超音波リークデテクタ", "170S", ""],
        ["SERV.483.20744", 'AT WS/RS SERVICE BALANCER ASS', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.23632", 'IRIS AT HOISTING TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.23634", 'RH IRIS HOIST TOOL ASSY', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.25714", 'ATWS REFERENCE HEIGHT BLOCK', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "ASML", "ATWS REFERENCE HEIGHT BLOCK", "306.86ｍｍ/303.0ｍｍ", ""],
        ["SERV.483.29422", 'MAINBODY LIFTING BEAM', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.34391", 'AT TOOLSET OPTICAL LEVEL MSF', "TOKYO (KT)", "タマヤ計測システム㈱", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.483.35232", 'HEIGHT ADJUSTMENT TOOL WSAT', "MIYAGI (KT)", "Sunsea", 12, "表示器とセット校正", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Probes", "GT22(32.10924)", ""],
        ["SERV.483.35322", 'HOISTING ADAPTER Y-BEAM ATWT', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.36806", 'MB LIFT & SHIFT ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.38901", 'OPHIR L30A-10MM-SH-26MM', "SG", "", 18, "", "2017/04/17", "TRUE", "FALSE", "", "OPHIR", "OPHIR L30A-10MM-SH-26MM", "L30A-10MM-SH-26MM", ""],
        ["SERV.483.40151", 'ANGULAR TORQUE WRENCH 0.5 NM', "TOKYO (KT)", "NEC MP", 24, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.483.48353", 'HOIST YOKE LENS ASSY TWINSCAN', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.54892", 'JIB EXTENSION RECOMBI UNIT', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.54902", 'HOISTING BAR RECOMBI UNIT', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.54911", 'HOISTING BAR MIRRORBLOCK', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.54912", 'HOISTING BAR MIRRORBLOCK', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.56871", 'TSU POSITIONING TOOL ASSY', "MIYAGI (KT)", "Sunsea", 12, "表示器とセット校正", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Probes", "GT22（32.10924）", ""],
        ["SERV.483.57831", 'HOIST INTERF SERV BALANCER', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.57832", 'HOIST INTERF SERV BALANCER', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.60721", 'AL OM LIFT TOOL TWIN SERVICE', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.61091", 'MAN TEMPTUNE CALIBRATION KIT', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.483.64772", 'LENS TOP TOOL 3 IL AT', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Electrical Comparator", "T10", ""],
        ["SERV.483.69213", 'ALIGN TL ZA TO CAF2 ASSY', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "PHILIPS", "Digital Multimeter", "PM2525", ""],
        ["SERV.483.77723", 'PARKING TOOL REMA OBJECTIVE', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.483.82763", 'ATWT STONE TO METROFRAME TOOL ASSY', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.485.13631", 'TORQUE WRENCH 4101-02 2-25NM GEDORE', "MIYAGI (KT)", "Sunsea", 24, "", "2017/04/17", "TRUE", "FALSE", "", "GEDORE", "TORQUE WRENCH", "803932", ""],
        ["SERV.485.22011", 'TORQUEWRENCH (10-100NM) 4100-01', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.485.22451", 'TORQ WRENCH (40-200NM)- NO HEAD', "MIYAGI (KT)", "Sunsea", 24, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "TORQUE WRENCH", "6292-1CT", ""],
        ["SERV.485.32041", 'HYPOT III 3670', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "Associated Research Inc", "Dielectric Withstand Tester", "3770", ""],
        ["SERV.485.34091", 'GROUND BONDING TESTER HYAMP-3', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.487.01681", 'BOTTOM MODULE INSTALL TOOLSET', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.04353", 'OM IR HOISTING TOOL ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.06043", 'HOIST YOKE T1400 LENS ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.11901", 'ATRS SSM D2 HOISTING ADAPTOR', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.14561", 'AWH AIR GAP TOOL ASSY', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.487.14901", 'BSM INSTALL TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.22522", 'AG Z REF TOOL ASSY', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.487.26872", 'XT 1400 ACUA LIFTING YOKE ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.29857", 'HT ILL INSTALL TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.35303", 'ACC MK3+4 FAN EXCHANGE CRANE', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.38171", 'AT PH ADJUSTMENT TOOL ASSY', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.487.39513", 'HOISTING ADAPTOR XTREMA CRANE', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.42271", 'GUIDE SPINDLE XTREMA', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "ASML", "GUIDE　SPINDLE　XTREMA", "", ""],
        ["SERV.487.48781", 'X-BEAM HOISTING TOOL ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.50991", 'LBP PE FLOW SETTING TOOL', "TOKYO (KT)", "大王電機", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.487.59574", 'EXTENSION PEN ZA HA CZO', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.67234", 'ILTPO ALIGNMENT TOOL AERIAL-XP', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.487.67236", 'ILTPO ALIGNMENT TOOL AERIAL-XP', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "Mogema BV", "4022.487.6723", "4022.487.6723", ""],
        ["SERV.487.70811", 'AIRMOUNT MOUNTING TOOL', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "GEDORE", "TORQUE　WRENCH", "753", ""],
        ["SERV.487.76112", 'HOIST ADAPT UNIVERSAL WLL600KG', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.81705", 'WS MB HANDLING TOOL ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.91301", 'UCM - FIELD TOOL ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.92081", 'SERVICE PLATFORM H1000', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.92091", 'SERVICE PLATFORM H1400', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.487.92101", 'SERVICE LADDER H1900', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.488.00116", 'RH CHAIN3-LEGSST0,94MTR-2100KG', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.488.00117", 'RH CHAIN4-LEGSST1,17MTR-1500KG', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.488.00118", 'RH CHAIN4-LEGSST0,64MTR-1500KG', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.488.00621", 'PHM TORQUE WRENCH 100 NCM', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HUBER＋SUHNER", "TORQUE　WRENCH", "74　Z-0-0-21", ""],
        ["SERV.488.02791", 'LOW POWER DETECTOR THIN', "SG", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.489.50083", 'TORQUE WRENCH AL 3/4 140-760 NM', "MIYAGI (KT)", "Sunsea", 24, "", "2017/04/17", "TRUE", "FALSE", "", "GEDORE", "TORQUE WRENCH", "TYP D", ""],
        ["SERV.489.50182", 'TORQUE WRENCH 2-25 NM 9X12', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "TORQUE WRENCH", "6282-1CT", ""],
        ["SERV.489.50260", 'MULTIMETER DIG FLUKE 177', "TOKYO (KT)", "NEC MP", 24, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.489.50265", 'CARRIER PLATE SUCTION PA 80KG', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.489.50517", 'GAS ALERT CLIP 02 BW GAA-2X-5', "TOKYO (KT)", "", 6, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.489.50521", 'WRENCH TORQUE ST 2-10 NM 9X12', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "TORQUE WRENCH", "6280-1CT", ""],
        ["SERV.489.50841", 'WRENCH TORQUE 1/4  1 - 12NM', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "GEDORE", "TORQUE　WRENCH", "753-11", ""],
        ["SERV.489.50876", 'WRENCH TORQUE 1/2 20-120NM 6121-1-CT', "MIYAGI (KT)", "Sunsea", 24, "", "2017/04/17", "TRUE", "FALSE", "", "GEDORE", "TORQUE WRENCH", "TYP B", ""],
        ["SERV.489.51446", 'GAUGE FORCE SET ANGLE - FB100N', "MIYAGI (KT)", "Sunsea", 12, "", "2016/07/10", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.489.51710", 'METER PRESS 0.2MPA MONOX DC2000 ENG', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.489.52473", 'TORQUE WRENCH  80-360NM', "MIYAGI (KT)", "Sunsea", 12, "", "2016/07/10", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.489.52488", 'WRENCH TORQUE 0,2-2,0NM 9X12', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "GEDORE", "TORQUE　WRENCH", "760-00", ""],
        ["SERV.489.52797", 'WRENCH TRQ 40-200 NM 14X18', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "TORQUE WRENCH", "6292-1CT", ""],
        ["SERV.489.52997", 'CHAIN 4-LEG SST 1,0MTR-1120KG', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.489.53120", 'CHAIN 2-LEG SST 1MTR-750KG', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.489.53247", 'WRENCH TORQUE 10-60NM 9X12', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "TORQUE WRENCH", "6290-1CT", ""],
        ["SERV.489.53450", 'WRENCH TORQUE 1/4 1-5NM', "MIYAGI (KT)", "Sunsea", 24, "", "2018/07/31", "TRUE", "FALSE", "", "GEDORE", "TORQUE　WRENCH", "4549-00", "Added"],
        ["SERV.489.53854", 'CARRIER PLATE SUCTION 50 KG', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.489.54287", 'HOOK EYE LCH SWVL WWL 1250KG', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.09799", 'ATRS CHUCK SERV HANDLING TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.16222", 'TORQUE WRENCH 10-60 NM', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "TORQUE　WRENCH", "6290-1CT", ""],
        ["SERV.502.16226", 'Z FRAME INTERCEPT ADJ TL', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.502.16241", 'OPHIR PE-50-HIPO ASML 2KHz', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.16242", 'OPHIR PE-50-BBH-ASML 2KHz', "SG", "", 18, "", "2017/04/17", "TRUE", "FALSE", "", "OPHIR", "PE50BBH-ASM3", "PE50BBH-ASM3", ""],
        ["SERV.502.16255", 'TESA DISPLAY UNIT TTD20(220V)', "MIYAGI (KT)", "Sunsea", 12, "", "2018/11/08", "TRUE", "FALSE", "", "TESA", "Electrical Comparator", "TT20(44.30005)", "Added"],
        ["SERV.502.16264", 'HIGH POWER OAI I-LINE METER', "SG※", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.16367", 'MULTI MIRROR TOOL TWIN SERV.', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.502.16395", 'ACC FAN EXCHANGE CRANE SET', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.16402", 'ATWT SS TORQUE WRENCH ASSY', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "TORQUE　WRENCH", "6282-1CT", ""],
        ["SERV.502.16443", 'PLANETABLE ELEVATOR', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "ASML", "PLANETABLE ELEVATOR", "4022.450.7952", ""],
        ["SERV.502.16524", 'LTT MAIN ASSY 1400', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Electrical Comparator", "TT10 (44.30008)", ""],
        ["SERV.502.16527", 'TSU POSITIONING TOOL ASSY COMP', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Probes", "GT22(32.10924）", ""],
        ["SERV.502.16546", 'WRENCH TRQ PUSH-ON 12NM 9X12', "MIYAGI (KT)", "Sunsea", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.16551", 'MICROMANOMETER MONOX DC100-RV', "TOKYO (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "WOHLER", "MICRO MANOMETER", "DC100", ""],
        ["SERV.502.16552", 'WRENCH TORQUE 1/4 20-120 CNM', "MIYAGI (KT)", "Sunsea", 24, "", "2017/04/17", "TRUE", "FALSE", "", "GEDORE", "TORQUE WRENCH", "757-01", ""],
        ["SERV.502.16561", 'LM POWERMETER TOOLKIT', "SG", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.16664", 'SPM MULTI MIRROR TL 1400 EXP SERV', "NL10", "", 12, "", "2017/04/17", "TRUE", "TRUE", "12", "", "", "", ""],
        ["SERV.502.16665", 'AG-MT ELEVATOR ASSY', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.16666", 'SPM MULTI MIRROR TOOL T - LS QUAL', "NL10", "", 12, "", "2017/04/17", "TRUE", "TRUE", "12", "", "", "", ""],
        ["SERV.502.16738", 'XTWT SS REF HEIGHT CALIBER', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.16759", 'LM HAND-HELD POWERMETER', "SG", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.16760", 'LM POWERMETER TOOLKIT', "SG", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "NEWPORT", "Handheld Optical Power Meter", "1916-R", ""],
        ["SERV.502.16778", 'NT WS PM Z-HEIGHT CALBR TESA SET (3X)', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Electrical Comparator", "TT10(44.30008)", ""],
        ["SERV.502.16816", 'IH MICROSCOPIC TOOL', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "IH MICROSCOPIC TOOL", "IH MICROSCOPIC TOOL", ""],
        ["SERV.502.16818", 'WI UECB HOISTING YOKE ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.16835", 'TESA GT31 0.2MM 0.02N SET', "MIYAGI (KT)", "Sunsea", 24, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.16846", 'TOOL ASSY MULTIMETER + PROBE', "NL10", "", 24, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.16849", '4PC RING HST SWVL STL-NP M10', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.16879", 'IL FRM HOIST & GUIDE TOOL', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.16906", 'STANDARD HOIST TOOL KIT', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.16911", 'LPP SISO FLOOR COVER SET', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.17025", 'HELIUM LEAKTEST SET ASM192T2D', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "Adixen", "Helium Leak Detector", "不明", ""],
        ["SERV.502.17054", 'TSI VELOCICALC METER', "TOKYO (KT)", "トランステック", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.17060", 'NT WI BRIDGEHEAD ADJUST TOOL', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Digital Dial Gauge (x6)", "19.30134", ""],
        ["SERV.502.17063", 'RH KTEIP MK2 TOOL RETICLE ASSY', "NL10→US50", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.17097", 'SET RING SWVL SST M8-0,2T (4X)', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.17110", 'IS SENSOR MOUNT POS TOOL ASSY', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.17144", 'SPM MULTI MIRROR TL 1400 EXP S', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.502.17145", 'SPM MULTI MIRROR TOOL T - LS Q', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.17157", 'XT LENSSWAP CRANE V2', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.17273", 'RS LIFTING TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.17462", 'NXT WS MK4I DHA SWAP TOOLSET', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.17512", 'HOIST YOKE ASSY SST WLL 400KG', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.17606", 'RH PPD HOIST FIXTURE', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.17619", 'XT SERVICE CRANE V1&V2', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.17652", 'TWINSCAN SERVICE CRANE V1&V2', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.17656", 'FLEXWAVE MANIF ALIGN TOOL SET', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.502.17712", 'GAS SUPPLY UNIT', "New", "", 24, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.502.17750", 'AWH ROBOT LIFT TOOL', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.17817", '4CLM FCP/LMA POWER TOOL KIT', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.502.17871", 'RS LIFTING TOOL', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.502.28208", 'ADJUSTABLE SPIRIT LEVEL', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "―", "Clinometer", "0.1ｍｍ/ｍ", ""],
        ["SERV.502.28286", 'LEAKTEST KIT', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.29025", 'LASER POWER METER + ADAPTER', "SG", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.29150", 'WATER CONDUCTIVITY METER SET', "TOKYO (KT)", "宇野株式会社 - ハンナ", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.502.29175", 'ELEC CAB SCAN & ARMS JACK SET', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.623.07421", 'TDS 3034 OSCILLOSCOPE', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.625.05952", 'ALV62 SMASH INSTALL TOOL ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.625.18814", 'NXE WS PM HOISTING TOOL ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.625.20282", 'AM & TOP BRACKET HOISTING TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.625.43002", 'RH NXE RTEIP', "NL10→US50", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "??", "", "", ""],
        ["SERV.625.43402", 'IL NXE31 AT HOIST TOOL ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.625.49691", 'RH LDLCK CAL PLATE ALIGN TOOL', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.625.50372", 'ALV60 WAFER PLANE TOOL ASSY', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "NEWPORT", "Silicon Detector (Photo Detector)", "818-SL", ""],
        ["SERV.625.50381", 'ALV54 LMA 30MM PIN HOIST ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.625.63531", 'POB FIBER TEST AND CLEAN SET', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.625.71251", 'NXE WS E-PIN LOCK ALLEN KEY', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.625.72771", 'TENMA LCR MULTIMETER 8150', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TENMA", "Capacitance Meter", "72-8150", ""],
        ["SERV.625.73271", 'MEGGER INSULATION TESTER', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.625.76601", 'RH NXE RING HST SWVL SST M8(3)', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.625.76611", 'RH NXE RNG HST SWVL SST M10(4)', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.630.17742", 'GAS SUPPLY UNIT', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.630.17743", 'GAS SUPPLY UNIT', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "ASML ?", "GAS SUPPLY UNIT", "4022 630 17743", ""],
        ["SERV.630.17744", 'GAS SUPPLY UNIT', "NL10", "", 24, "", "2017/04/17", "TRUE", "FALSE", "", "ASML?", "GAS SUPPLY UNIT", "4022.630.17743", ""],
        ["SERV.632.01042", 'HOIST ADAPTER FLG SWAP', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.05782", 'SM LIFT TOOL ADAPTER ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.10514", 'LIFT TABLE ILL 400-1250MM', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.10515", 'LIFT-TABLE ILL 400-1250MM', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.12462", 'HYDRAULIC JACK SET CMPLT', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.13371", 'IL REMA-O HOIST PLATE ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.26695", 'NT SPM EPA MOUNTING TOOL ASSY', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.27555", 'NT SPM EPA TRANSPORT TOOL ASSY', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.28223", 'NT SPM LRA POS TOOL E1/E3', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.632.28224", 'NT SPM LRA POS TOOL E1/E3', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "ASML", "NT SPM LRA POS TOOL E1/E3", "―", ""],
        ["SERV.632.30081", 'TOOL, RADIAL BELT TENSIONING', "新規", "", 24, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.632.30091", 'FIXTURE, CALIBR, KINM PINS', "New", "", 24, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.632.30101", 'TOOL, XPS BELT TENSIONING', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.632.36244", 'NT WS INTERM. DOCKING BODY TOOL', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.632.39942", 'ATWI LCW PUMP ADJUSTMENT TOOLKIT', "TOKYO (KT)", "GE Sensing - 丸文経由", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.632.41634", 'NT SPM LRA POS TOOL E2', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "ASML", "NT SPM LRAPOS TOOL E2", "SERV.632.41634", ""],
        ["SERV.632.41993", 'RS MAGNET YOKE LIFT TOOL ASSY (2X)', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.43271", 'RS MOVINGFRAME LIFT HOIST ASSY', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.44822", 'ART INSTALL LIFT TOOL ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.64863", 'LMA HOIST ADAPTER NXT', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.70071", 'RS XTIV X-INTFACE TORQUE TOOL', "JPN", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.632.73022", 'LT ME ADJ TOOL SET 14XY', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.632.75294", 'WEX SAFETY LEVEL TOOL', "New", "", 18, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.632.75843", 'NT WS MAGNETPLATE TO MF ADJUST TOOL', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.632.75845", 'NT WS MAGNETPLATE TO MF ADJ TL', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.632.78802", 'RH IRL UNIVERSL LIFT TOOL ASSY', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.79622", 'LT ME ADJ. TOOL SET', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.632.84251", 'WH DOCK TOOL ASSY NXT', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.632.85051", 'UECB HOISTING YOKE ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.85362", 'ELLIP. MIRROR SWAP TOOL XTIII', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.632.87001", 'ICM TOOL MK2', "NL10", "", 24, "", "2017/04/17", "TRUE", "FALSE", "", "ASML ?", "ICM Tool", "ICM Tool", ""],
        ["SERV.632.87002", 'ICM TOOL MK2', "New", "", 24, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.632.87401", 'SM INSTALL GUIDE TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.638.07662", '4C LM FCP/LMA POWER TOOL KIT', "SG", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.638.07663", '4C LM FCP/LMA POWER TOOL KIT', "SG", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "NEWPORT", "Handheld Optical Power Meter", "1916-R", ""],
        ["SERV.638.07664", '4CLM FCP/LMA POWER TOOL KIT', "新規SG", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.638.10802", 'DEP LT AS TOOL SET', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.638.12162", 'LT ME 8XY ADJ TOOL SET', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.638.19241", 'LS AG COARSE ADJ REF TOOL SET', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "ASML ??", "LS AG COARSE ADJ REF TOOL", "4022 632 3575.1", ""],
        ["SERV.638.29013", 'SPM EPA MOUNT WRENCH TOOL ASSY', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "HAZET", "TORQUE WRENCH", "6282-1CT", ""],
        ["SERV.638.45711", 'CABINETS HOISTING TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.638.45722", 'NT WS MP POSITIONING PIN CAL TOOL', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.638.61793", 'RGX & RZX 2010 CONT.HOIST TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.638.64994", 'IH AK ACTIVE FLOW CLEANING SET', "TOKYO (KT)", "Sunsea", 12, "", "2017/04/18", "TRUE", "FALSE", "", "ASML", "IH AK ACTIVE FLOW CLEANING SET", "4002.632.11506", "Added"],
        ["SERV.638.65601", 'WH ATM ROBOT SWAP TL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "6", "", "", "", "Added"],
        ["SERV.638.66811", 'NXE RND30-RND20 ADAPTER', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.638.68161", 'STEP-LADDER 3 STEPS', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.638.75101", 'ATWT WS SEMI JACK UP TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.638.83172", 'NXT WS CALI BLOCK LEVIZ (4PCS)', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.638.85692", 'IL SERVICE CRANE XP FLEX', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.638.91254", 'YS-MMA-PAT-TOOL SET', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.638.92791", 'GAS DETECTOR X-AM 5000', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "Drager", "Gas Sensor H2, O2", "X-AM 5000", ""],
        ["SERV.638.98601", 'VOLU CHECK SERV TOOL AS-HLPR ASSY SERV', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.639.18102", 'LEAK TEST TOOL MK3 (MAX.10BARG)', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "Tradinco", "PRESSURE CALIBEATOR", "MK3", ""],
        ["SERV.639.18103", 'LEAK TEST TOOL MK3 (MAX.10BARG)', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.639.18104", 'LEAK TEST TOOL', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.640.29402", 'LM HAND-HELD POWERMETER', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.640.29422", 'LM 818 DETECTOR/CAL ADAPT ASSY', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.640.56072", 'RACA GAP MEASURE TOOL', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.644.08152", 'NT WS LS LEAKTEST HOSE ASSY FEMALE', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.644.08153", 'NT WS LS LEAKTEST HOSE ASSY F', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.644.08154", 'NT WS LS LEAKTEST HOSE ASSY F', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.644.09032", 'NT WS LA2LOS SENSOR ADJ TOOL', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TESA", "Digital Dial Gauge", "19.30134", ""],
        ["SERV.644.09033", 'NT WS LA2LOS SENSOR ADJ TOOL', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TESA", "デジタルダイヤルゲージ", "19.30134", ""],
        ["SERV.644.12271", 'EUV RH LOADPORT ASSY LVL TOO', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.644.13021", 'NXT WS PM HANDLING TOOL REW ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.644.14021", 'STD HAND TOOL KIT VACUUM 1/2', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.644.14031", 'STD HAND TOOL KIT VACUUM 2/2', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.644.27032", 'NXE 3100 5T HOIST ADAPTER SET', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.644.31011", 'ICM EXTENSION TOOL', "新規", "", 24, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.644.32801", 'NT WSL UXY-SLAB PRESSURE TOOL', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.644.32811", 'NT WSL UXY-SLAB PRESSURE TOOL', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.644.33173", 'NXT WS RZ LIM RZ ADJUST TOOL', "MIYAGI (KT)", "Sunsea", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TESA", "デジタルダイヤルゲージ", "19.30134", ""],
        ["SERV.644.52811", 'TSI VELOCICALC METER 9555', "TOKYO (KT)", "トランステック", 12, "", "2017/04/17", "TRUE", "FALSE", "", "TSI Incorporated", "ANEMOMETER", "9565-P", ""],
        ["SERV.644.53522", 'NXT WS FIT SET RECEPT CONNECT', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.644.54221", 'RS NXE RETEX HOIST', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.644.62331", 'CONNECTION SET LTT', "", "", , "Pair品", "2018/11/08", "FALSE", "FALSE", "", "", "", "", ""],
        ["SERV.644.89494", 'AL V62 MK3.0 LIFT & GUIDE ASSY', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.646.28121", 'PSDC HOISTING RING TOOL SET', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.646.88341", 'CROWCON C02 SNIFFER', "TOKYO (KT)", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.649.14564", 'NXT WS MK4I RZ PIN TENSION TL', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.649.16161", 'NXT SWB MK3.2 ADJUST TOOL KIT', "JPN", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.649.34097", 'NXT WS MK4I PM BOTTOM SERV TL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.649.56892", 'NXT WS MK4I VAC MEASURE TOOL', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.649.71876", 'NT WS BM3 DRAINING TOOL', "新規", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.649.71877", 'NXT3 WS DRAINING TOOL KIT', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.649.71885", 'NXT3 WS LEAKTEST TOOL KIT', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.652.08003", 'SPM NXT EPA MOUNTING TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.652.13231", 'NXT SWB ADJ TOOL MK2 QUALIFIED', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.652.51005", 'NXT WS MK4I SS LIFT TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.652.73003", 'NXT WS MK4I SS HOIST SERV TOOL', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.652.75192", 'AT WS/RS SERVICE BALANCER V2', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.652.86501", 'MP2SF Z-ADJUSTMENT TOOL', "新規", "", 24, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.653.80091", '171384 YOKE ASSY, HOISTING, QC', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.653.81041", 'S173188 COLLECTOR ASSY, TRANSFE', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.655.00591", 'FLUKE 810 VIBRATION MEAS TOOL', "NL10", "", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.655.08961", 'HANDPUMP HCF STLST VALVE V2', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.655.37332", 'RS NXT3+ DUCT CAGE/LIFT TOOL', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.655.94561", 'HT LMA LIFTING TOOL CRANE ASSY', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "3", "", "", "", "Added"],
        ["SERV.659.48211", 'SERVICE RND20-RND30 ADAPT ASSY', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.659.54671", 'GMLD SET', "", "", 12, "", "2016/07/10", "TRUE", "TRUE", "12", "", "", "", "Added"],
        ["SERV.659.83071", 'MICROMANOMETER MONOX DC100 SET', "TOKYO (KT)", "NEC MP", 12, "", "2017/04/17", "TRUE", "FALSE", "", "", "", "", ""],
        ["SERV.667.44461", 'IH MICROSCOPIC VHX-900F TOOL', "New", "", 12, "", "2018/11/08", "TRUE", "FALSE", "", "", "", "", "Added"],
        ["SERV.667.54601", 'ALIGHNMENT TOOL IL TPO-MECH', "MIYAGI (KT)", "", 12, "", "2017/11/02", "TRUE", "FALSE", "", "TESA", "Electrical Comparator", "TT10(44.30008)", "Added"],
        ["SERV.667.58581", 'EIM NXT TIT SERV', "", "", , "", "2018/11/08", "FALSE", "TRUE", "12", "", "", "", "Added"],

    ];

    for (let i = 0; i < adata.length; i++) {
        data[i] = {
            sid: i,
            Material: adata[i][0], Description: adata[i][1], CalPlace: adata[i][2], CalVendor: adata[i][3],
            CalInt: adata[i][4], Instruction: adata[i][5], ChangeDate: adata[i][6],
            NeedCal: adata[i][7], NeedSafety: adata[i][8], SafetyInt: adata[i][9],
            PMaker: adata[i][10], PName: adata[i][11], Pmodel: adata[i][12], Status: adata[i][13],
        };
    }

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
        //if (columnId === "CalDue") return;
        //if (columnId === "LatestCalDate") return;
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