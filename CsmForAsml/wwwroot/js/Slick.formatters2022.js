/***
 * Contains basic SlickGrid formatters.
 * 
 * NOTE:  These are merely examples.  You will most likely need to implement something more
 *        robust/extensible/localizable/etc. for your use!
 * 
 * @module Formatters
 * @namespace Slick
 */

(function ($) {
    // register namespace
    $.extend(true, window, {
        "Slick": {
            "Formatters": {
                "PercentComplete": PercentCompleteFormatter,
                "PercentCompleteBar": PercentCompleteBarFormatter,
                "YesNo": YesNoFormatter,
                "Checkmark": CheckmarkFormatter,
                "CalDue": CalDueFormatter,
                "Date": DateFormatter
            }
        }
    });

    function CalDueFormatter(row, cell, value, columnDef, dataContext) {
        if (value) {
            if (value.indexOf("Over") >= 0) {
                return "<span style='color:black; background-color:red ; font-weight:bold;'>" + value + "</span>";
            } else if (value.indexOf("TM") >= 0) {
                return "<span style='color:black; background-color:yellow ; font-weight:bold;'>" + value + "</span>";
            } else if (value.indexOf("NM") >= 0) {
                return "<span style='color:black; background-color: lime ; font-weight:bold;'>" + value + "</span>";
            } else
                return "<span style='color:black; background-color: white ; font-weight:bold;'>" + value + "</span>";
        }
    }

    function DateFormatter(row, cell, value, columndef, datacontext) {
        if (!value) {
            return "";
        } else {
            var d = new Date(value);
            var m = ("00" + (d.getMonth() + 1)).slice(-2);
            var day = ("00" + d.getDate()).slice(-2);
            return (d.getFullYear() + "/" + m + "/" + day);
        }
    }

    function PercentCompleteFormatter(row, cell, value, columnDef, dataContext) {
        if (value == null || value === "") {
            return "-";
        } else if (value < 50) {
            return "<span style='color:red;font-weight:bold;'>" + value + "%</span>";
        } else {
            return "<span style='color:green'>" + value + "%</span>";
        }
    }

    function PercentCompleteBarFormatter(row, cell, value, columnDef, dataContext) {
        if (value == null || value === "") {
            return "";
        }

        var color;

        if (value < 30) {
            color = "red";
        } else if (value < 70) {
            color = "silver";
        } else {
            color = "green";
        }

        return "<span class='percent-complete-bar' style='background:" + color + ";width:" + value + "%'></span>";
    }

    function YesNoFormatter(row, cell, value, columnDef, dataContext) {
        return value ? "Yes" : "No";
    }

    function CheckmarkFormatter(row, cell, value, columnDef, dataContext) {
        return value ? "<img src='../images/tick.png'>" : "";
    }
})(jQuery);