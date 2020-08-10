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

    $.get(host + "/MaterialNeedCals/GetData").then(
        function (ans) {
            console.log("Data received ");
            let length = ans.length;
            let index;

            data = ans;
            for (index = 0; index < length; index += 1) {
                let d = data[index];
                d.id = "id_" + index;
            }
            // end get data from host


            dataView = new Slick.Data.DataView({ inlineFilters: true });
            grid = new Slick.Grid("#myGrid", dataView, columns, options);
            grid.setSelectionModel(new Slick.RowSelectionModel());

            pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));
            columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);

            /*
            // move the filter panel defined in a hidden div into grid top panel
            $("#inlineFilterPanel")
                .appendTo(grid.getTopPanel())
                .show();
           */



            // execute following code after setup
            // initialize the model after all the events have been hooked up
            dataView.beginUpdate();
            dataView.setItems(data);
            dataView.setFilterArgs(filterValues);
            dataView.setFilter(myFilter);
            dataView.endUpdate();

            // if you don"t want the items that are not visible (due to being filtered out
            // or being on a different page) to stay selected, pass "false" to the second arg
            dataView.syncGridSelection(grid, true);

            // $("#gridContainer").resizable();
        },

        function (jqXHR, textStatus, err) {
            console.error("Error Hapened");
        }
    );

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

    grid.onCellChange.subscribe(function (e, args) {
        dataView.updateItem(args.item.id, args.item);
    });

    grid.onKeyDown.subscribe(function (e) {
        let rows = [];
        let i;

        // select all rows on ctrl-a
        if (e.which !== 65 || !e.ctrlKey) {
            return false;
        }

        for (i = 0; i < dataView.getLength(); i += 1) {
            rows.push(i);
        }

        grid.setSelectedRows(rows);
        e.preventDefault();
    });

    grid.onSort.subscribe(function (e, args) {
        sortdir = args.sortAsc ? 1 : -1;
        sortcol = args.sortCol.field;

        dataView.sort(comparer, args.sortAsc);
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