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
    let host = window.location.protocol + "//" + window.location.host;

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

    const checkDuedate = function (ardata) {
        let d0 = moment();
        let d1 = firstDay(1);
        let d2 = firstDay(2);
        let caldue;
        // check cal due and generate CalDueStatus
        for (let i = 0; i < ardata.length; i += 1) {
            let status = "";
            caldue = moment(ardata[i].Date0, "YYYY/MM/DD");
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

    // events from fnkey area



    // main routine execution start from here

    checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel"
    });

    columns.push(checkboxSelector.getColumnDefinition());


    columns.push({ id: "Plant", name: "Plant", field: "plant", sortable: true, editor: Slick.Editors.TextNC });
    columns.push({ id: "Serial", name: "Serial", field: "serialNumber", sortable: true });
    columns.push({ id: "Material", name: "Material", field: "material", width: 120, sortable: true });
    columns.push({ id: "Description", name: "Description", field: "description", width: 260, sortable: true });
    columns.push({ id: "Date0", name: "CalDue", field: "calDue", sortable: true });
    columns.push({ id: "CalDueStatus", name: "Status", field: "calStatus", width: 60, formatter: Slick.Formatters.CalDue, sortable: true },);
    columns.push({ id: "Comment", name: "Comment", field: "comment", width: 60, sortable: true },);
    columns.push({ id: "Date1", name: "Latest CalDate", field: "latestCalDate", sortable: true });
    columns.push({ id: "Date2", name: "SafetyDue", field: "safetyDue", sortable: true });
    columns.push({ id: "Date3", name: "Latest SafetyDate", field: "latestSafetyDate", sortable: true });
    columns.push({ id: "CalInt", name: "Cal Interval", field: "calInt", sortable: true });
    columns.push({ id: "CalPlace", name: "Cal Place", field: "calPlace", sortable: true });
    columns.push({ id: "StoreLoc", name: "Store Location", field: "storeLocation", sortable: true });
    columns.push({ id: "SysStat", name: "System Status", field: "systemStatus", sortable: true });
    columns.push({ id: "UserStat", name: "User Satus", field: "userStatus", sortable: true });
    columns.push({ id: "Room", name: "Room", field: "room", sortable: true });
    columns.push({ id: "SuperordEquip", name: "SuperordEquip", field: "superordEquip", sortable: true });
    columns.push({ id: "SortField", name: "SortField", field: "sortField", sortable: true });
    columns.push({ id: "Machine", name: "Machine", field: "machine", sortable: true });
    columns.push({ id: "ToolkitMachine", name: "ToolkitMachine", field: "toolkitMachine", sortable: true });
    columns.push({ id: "ToolkitSloc", name: "ToolkitSloc", field: "toolkitSloc", sortable: true });
    columns.push({ id: "InCal", name: "InCal", field: "inCal", sortable: true });
    columns.push({ id: "NeedCal", name: "NeedCal", field: "needCal", sortable: true });
    columns.push({ id: "NeedSafety", name: "NeedSafety", field: "needSafety", sortable: true });
    columns.push({ id: "PSN", name: "PSN", field: "pSN", sortable: true });


/*  
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
 
    };
 */   

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