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
        needCal: null,
        needSafety : null,
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
        // by needCal
        if (args.needCal !== null) {
            if (args.needCal !== item.NeedCal) {
                return false;
            }
        }
        // by needSafety
        if (args.needSafety !== null) {
            if (args.needSafety !== item.NeedSafety) {
                return false;
            }
        }

        // text filters        
        for (let columnId in args.texts) {
            if (columnId !== undefined && args.texts[columnId] !== "") {
                let val = item[columnId];  // in order to this statement work, keep 'id:' is equal to 'field:' in column definition
                if ( ! Boolean(val)  || val.toUpperCase().indexOf(args.texts[columnId]) === -1) {
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
        if ($.trim(kwd)) {
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
        let sel = $(this).val();
        if (sel === "True") {
            filterValues.needCal = true;
        } else if (sel === "False") {
            filterValues.needCal = false;
        } else {
            filterValues.needCal = null;
        }
        selectListReloadLevel = 2;
        updateFilter();
    });

    $("#selectSafety").on("change", function () {
        let sel = $(this).val();
        if (sel === "True") {
            filterValues.needSafety = true;
        } else if (sel === "False") {
            filterValues.needSafety = false;
        } else {
            filterValues.needSafety = null;
        }       
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

 
    // main routine execution start from here

    checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel"
    });

    columns.push(checkboxSelector.getColumnDefinition());   
    columns.push({ id: "Material", name: "Material", field: "Material", width: 120, sortable: true });
    columns.push({ id: "MaterialDescription", name: "Description", field: "MaterialDescription", width: 260, sortable: true });
    columns.push({ id: "CalPlace", name: "Cal Place", field: "CalPlace", sortable: true });
    columns.push({ id: "CalVendor", name: "Cal Vendor", field: "CalVendor", sortable: true });
    columns.push({ id: "Instruction", name: "Instruction", field: "Instruction", sortable: true });
    columns.push({ id: "NeedCal", name: "NeedCal", field: "NeedCal", sortable: true });
    columns.push({ id: "NeedSafety", name: "NeedSafety", field: "NeedSafety", sortable: true });
    columns.push({ id: "CalInterval", name: "Cal Interval", field: "CalInterval", sortable: true });
    columns.push({ id: "SafetyInterval", name: "Safety Interval", field: "SafetyInterval", sortable: true });
    columns.push({ id: "PMaker", name: "P.Maker", field: "PMaker", sortable: true });
    columns.push({ id: "PName", name: "P.Name", field: "PName", sortable: true });
    columns.push({ id: "PModel", name: "P.Model", field: "PModel", sortable: true });
    columns.push({ id: "Status", name: "Status", field: "Status", sortable: true });
    columns.push({ id: "ChangeDate", name: "ChangeDate", field: "ChangeDate", sortable: true });
   
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
        if (columnId === "NeedCal" || columnId ==="NeedSafety" || columnId === "CalInterval" ) return;
        
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

    
    $.get(host + "/MaterialNeedCals/GetData").then(
        function (ans) {
            console.log("Data received ");
            let length = ans.length;            

            data = ans;
            //add :id to each row
            for (let index = 0; index < length; index += 1) {
                let d = data[index];
                d['id'] =  index;
            }



            // execute following code after setup
            // initialize the model after all the events have been hooked up
            dataView.beginUpdate();
            dataView.setItems(data,"id");
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
    // grid.onClick.subscribe(function (e, cell) {
    //     let x = e;
    //     let y = cell;
    // })

    /*
    dataView.beginUpdate();
    dataView.setItems(data, "sid");
    dataView.setFilterArgs(filterValues);
    dataView.setFilter(myFilter);
    dataView.endUpdate();
    dataView.syncGridSelection(grid, true);

    showNumber();
    updateDropdownList();*/

    showNumber();
});