/// <reference path="../../lib/jquery/3.3.1/jquery.js" />

Object.size = (obj) => {
    let size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

String.replaceAll = (text, oldText, newText) => text.split(oldText).join(newText);

/**
 * @param {string} text 
 * @param {object} obj require a object like {"oldText": "newText"}
 */
String.replaceAll2 = (text, obj) => {
    for (oldText in obj) {
        text = String.replaceAll(text, oldText, obj[oldText]);
    }
    return text;
};

/**
 * get file async
 * @param {string} url 
 * @returns promise
 */
$.extend({
    // would not work for chrome locally (since url is file:///..)
    // so try the following codes to run a local html server
    // "python -m http-server" (for py3)  OR  "python -m SimpleHTTPServer" (for py2)
    getFile: (url) => new Promise((executor, reject) => {
        $.ajax({
            async: true,
            url: url,
            dataType: "text",
            success: (results) => executor(results),
            error: () => reject("fail loading by ajax: " + url)
        });
    })
});

$.fn.extend({
    validity: function(validity, msg) {
        if (validity) {
            $(this).removeClass("is-invalid");
        } else {
            $(this).addClass("is-invalid");
        }
        if (typeof(msg)=="string" && $(this).next().hasClass("invalid-tooltip")) {
            $(this).next().text(msg);
        }
        return $(this);
    },

    removeValidity: function() {
        return $(this).removeClass("is-invalid");
    },

    checked: function(val = null) {
        if (typeof(val)=="boolean") {
            $(this).prop("checked", val);
            return $(this);
        } else {
            return $(this).prop("tagName").toLowerCase()=="input" &&
                   ($(this).attr("type")=="checkbox" || $(this).attr("type")=="radio") &&
                   $(this).prop("checked");
        }
    },

    disabled: function(val = null) {
        return typeof(val)=="boolean"
            ? $(this).prop("disabled", val)
            : $(this).prop("disabled");
    },

    /**
     * modified from https://www.w3schools.com/howto/howto_js_autocomplete.asp
     * 
     * @param {string[]} choices array of string of choices
     */
    autocomplete: function(choices) {
        let inputBox = $(this);
        if (inputBox.attr("type")!="text") {
            return inputBox;
        }
        if (!choices) {
            choices = inputBox.attr("autocompleteItems").split(",");
        }
        if (!choices || choices==[]) {
            return inputBox;
        }
        let currentFocus;
        inputBox.on("input focusin", () => {
            const val = $(this).val();
            closeAllLists();
            currentFocus = -1;
            let list = $("<div id=\""+$(this).attr("id")+"autocomplete-list\" class=\"autocomplete-items\"></div>");
            $(this).parent().append(list);
            let unhighlighted = [];
            for (let i in choices) {
                if (choices[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                    list.append($("<div value=\""+choices[i]+"\"><strong>"+choices[i].substr(0,val.length)+"</strong>"+choices[i].substr(val.length)+"</div>"));
                } else {
                    unhighlighted.push(choices[i]);
                }
            }
            for (let j in unhighlighted) {
                list.append($("<div value=\""+unhighlighted[j]+"\">"+unhighlighted[j]+"</div>"));
            }
            list.children().each(() => {
                $(this).click(() => {
                    inputBox.val($(this).attr("value")).change();
                    closeAllLists();
                });
            });
        });
        inputBox.on("keydown", (e) => {
            let x = $("#" + $(this).attr("id") + "autocomplete-list div");
            if (e.keyCode == 40) { // arrow DOWN
                if ($("#" + $(this).attr("id") + "autocomplete-list").length == 0) {
                    $(this).focus();
                    return false;
                }
                currentFocus++;
                addActive(x);
            } else if (e.keyCode == 38) { // arrow UP
                currentFocus--;
                addActive(x);
            } else if (e.keyCode == 13) { // ENTER
                if (currentFocus > -1) {
                    if (x) {
                        x[currentFocus].click();
                        currentFocus = -1;
                        return false;
                    }
                } else {
                    let node = $(this);
                    while (!node.is("form") && !node.is(".modal-content") && !node.is("body") && !node.is("html")) {
                        node = node.parent();
                    }
                    node.find(".btn-primary").click();
                }
            } else if (e.keyCode == 27) { // ESC
                if ($("#" + $(this).attr("id") + "autocomplete-list").length > 0) {
                    closeAllLists();
                    return false;
                }
            }
        });
        let addActive = (x) => {
            if (!x) {
                return false;
            }
            removeActive(x);
            if (currentFocus >= x.length) {
                currentFocus = 0;
            }
            if (currentFocus < 0) {
                currentFocus = (x.length - 1);
            }
            const current = $(x[currentFocus]);
            current.addClass("autocomplete-active");
            
            const unitHeight = current.outerHeight();
            const parent = current.parent();
            if ((currentFocus+1)*unitHeight - parent.scrollTop() > parent.height()) {
                parent.scrollTop((currentFocus+1)*unitHeight - parent.height());
            }
            if (currentFocus*unitHeight < parent.scrollTop()) {
                parent.scrollTop(currentFocus*unitHeight);
            }
        }
        let removeActive = (x) => {
            x.each(function() {
                $(this).removeClass("autocomplete-active");
            });
        }
        let closeAllLists = (elmnt) => {
            $(".autocomplete-items").each(function() {
                if (elmnt != $(this)[0] && elmnt != inputBox[0]) {
                    $(this).remove();
                }
            });
        }
        $(document).on("click", (e) => closeAllLists(e.target));
        inputBox.on("focusout", () => closeAllLists());
        return inputBox;
    }
});