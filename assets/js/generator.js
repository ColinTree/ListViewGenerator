'use strict';

const LVG_VERSION = "er: alpha"; //will be joined as "ver: alpha"
let TEMPLATE_DEFAULT;
let TEMPLATE_IMPORT;
let properties = {};

// Check promise availability
if (typeof(Promise)!='function') {
    alert("Please change or upgrade your browser to a newer version! e.g. Chrome 32+");
}
Object.size = function(obj) {
    let size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/**
 * depends: (Promise, FileReader), jquery, jszip, FileSaver.js, clipboard.js, alertify.js
 */

$(document).ready(function(){
    // load templates
    getFile("./assets/templates/default.template")
    .then(function(content){
        TEMPLATE_DEFAULT = content;
    });

    // upload handlers
    $("#upload_file").change(function(evt){
        const files = evt.target.files;
        if (files.length == 1) {
            $("#upload_file_label").text(files[0].name);
            let zip_;
            JSZip.loadAsync(files[0])
            .then(function(zip){
                zip_ = zip;
                return zip.file("project-info.json").async("text");
            })
            .then(function(txt){
                const projectInfo = JSON.parse(txt);
                setProjectInfo(projectInfo);
                // load imported template
                if (projectInfo.template=="Import") {
                    zip_.file(projectInfo.templateFileName).async("text")
                    .then(function(template){
                        TEMPLATE_IMPORT = template;
                        $("#field_template_file_download").css("display", "flex");
                    });
                }
            });
        } else {
            $("#upload_file_label").text("Choose file");
        }
    });

    // field handlers
    refreshPropertyDropdown();
    $('#properties_remove_modal').on('show.bs.modal', function(){
        const name = $("#field_properties_select").val();
        $(this).find('.modal-body b').text(name);
    });
    $("#properties_remove_modal .btn-danger").click(function(){
        const name = $("#field_properties_select").val();
        delete properties[name];
        refreshPropertyDropdown();
        $('#properties_remove_modal').modal('hide');
    });

    $('#properties_edit_modal').on('show.bs.modal', function(event){
        let action = $(event.relatedTarget).data('action')
        if (action=="add") {
            $(this).find('.modal-title').text("Adding property");
            setProprtyToModal({});
        } else if (action=="edit") {
            const name = $("#field_properties_select").val();
            setProprtyToModal(getFixedProperty(name));
        }
    });
    $("#properties_edit_modal").find(".btn-primary").click(function(){
        const property = getPropertyFromModal();
        properties[property.name] = property;
        refreshPropertyDropdown();
        $("#properties_edit_modal").modal("hide");
    });

    $("#property_designerVisible").change(function(){
        $("#property_editorType").prop("disabled", !$(this).prop("checked"))
    });
    autocomplete("property_type");

    function field_template_radio_change(){
        $("#field_template_file").parent().parent().parent()
            .css("display", $("#field_template_radio2").prop("checked") ? "flex" : "none");
    };
    $("#field_template_radio1").change(field_template_radio_change);
    $("#field_template_radio2").change(field_template_radio_change);

    $("#field_template_file").change(function(evt){
        const files = evt.target.files;
        if (files.length == 1) {
            TEMPLATE_IMPORT = null;
            $("#field_template_file_label").text(files[0].name);
            $("#field_template_file_download").css("display", "flex");
            if (!FileReader) {
                return alertify.error("Need a newer browser to support this (FileReader)");
            }
            let reader = new FileReader();
            reader.onload = function(oFREvent) {
                TEMPLATE_IMPORT = oFREvent.target.result;
            }
            reader.readAsText(files[0]);
        } else {
            $("#field_template_file_label").text("Choose file");
            $("#field_template_file_download").hide();
        }
    });
    $("#field_template_file_download_button").click(function(){
        let blob = new Blob([TEMPLATE_IMPORT], {type: "text/plain;charset=utf-8"});
        saveAs(blob, $("#field_template_file_label").text());
    });
    
    $("#field_form").submit(function(){
        return false;
    });
    $("#field_generateCodeZip").click(function(){
        const projectInfo = getProjectInfo();
        generateCode(projectInfo)
        .then(function(javaCode){
            const full_package = getFullPackage(projectInfo);
            let zip = new JSZip();
            let subfolder = zip;
            let packageArr = full_package.split('.');
            for (i in packageArr) {
                subfolder = subfolder.folder(packageArr[i]);
            }
            subfolder.file(projectInfo.componentName + ".java", javaCode);
            zip.generateAsync({type:"blob"})
            .then(function(content) {
                saveAs(content, projectInfo.componentName +"-sources.zip");
            });
        });
    });
    $("#field_generateCode").click(function(){
        const projectInfo = getProjectInfo();
        $("#field_java_code_preview").text("generating...");
        generateCode(projectInfo,)
        .then(function(javaCode){
            $("#field_java_code_preview").text(javaCode);
            $("#field_java_code").css("display", "flex");
        });
    });
    $("#field_downloadProject").click(function(){
        const projectInfo = getProjectInfo();
        let zip = new JSZip();
        zip.file("project-info.json", JSON.stringify(projectInfo));
        if (projectInfo.template=="Import") {
            let fileName = projectInfo.templateFileName;
            if (!fileName) {
                fileName = "custom.template";
            }
            zip.file(fileName, TEMPLATE_IMPORT);
        }
        zip.generateAsync({type:"blob"})
        .then(function(content) {
            saveAs(content, getFullPackage(projectInfo) + "." + projectInfo.componentName + ".lvg");
        });
    });

    new ClipboardJS('.btn');
});

/**
 * @return build projectInfo with current data from fields(the form)
 */
function getProjectInfo() {
    let projectInfo = {
        "package": $("#field_package").val(),
        "componentName": $("#field_componentName").val(),
        "joinCompNameToPackage": $("#field_package_addCompName").prop("checked"),
        "description": $("#field_description").val().replace(new RegExp('\n',"gm"),"\\n"),
        "version": Number.parseInt($("#field_version").val()),
        "template": $("#field_template_radio1").prop("checked") ? "Default" : "Import",
        "templateFileName": $("#field_template_radio1").prop("checked")
            ? "" : $("#field_template_file_label").text(),
    };
    if (projectInfo.template=="Import" && !TEMPLATE_IMPORT) {
        projectInfo.template = "Default";
    }
    return projectInfo;
}
/**
 * set projectInfo to current form
 * @param projectInfo 
 */
function setProjectInfo(projectInfo) {
    if (confirm('Applying a project would override what you current got on this page! Continue?')) {
        $("#field_package").val(projectInfo.package);
        $("#field_componentName").val(projectInfo.componentName);
        $("#field_package_addCompName").prop("checked", projectInfo.joinCompNameToPackage);
        $("#field_description").val(projectInfo.description);
        $("#field_version").val(projectInfo.version);
        $("#field_template_radio1").prop("checked", projectInfo.template=="Default");
        $("#field_template_radio2").prop("checked", projectInfo.template=="Import");
        if (projectInfo.template=="Import") {
            $("#field_template_radio2").change();
            $("#field_template_file").change();
            $("#field_template_file_label").text(projectInfo.templateFileName);
        }
    }
}

/**
 * @param  projectInfo
 * @return full package string
 */
function getFullPackage(projectInfo) {
    return projectInfo.joinCompNameToPackage
        ? projectInfo.package + '.' + projectInfo.componentName
        : projectInfo.package;
}

/**
 * @param  projectInfo
 * @return java code of the listview
 */
function generateCode(projectInfo) {
    return new Promise(function(executor, reject){
        let javaHead = ""
        + "/**\n"
        + " * This file is generated by ListView Generator(v"+LVG_VERSION+") by ColinTree\n"
        + " * Find more infomation on github: https://github.com/ColinTree/ListViewGenerator \n"
        + " * Generate time: " + new Date(Date.now()) + '\n'
        + " * Browser: " + navigator.userAgent + '\n'
        + " * Location: " + window.location + '\n'
        + " */\n";

        let content;
        try {
            content = getTemplate();
        } catch (err) {
            reject(err);
        }
        // __xxx__
        content = replace_all(content, "__componentName__", projectInfo.componentName);
        content = replace_all(content, "__version__", projectInfo.version);
        content = replace_all(content, "__full_package__", getFullPackage(projectInfo));
        content = replace_all(content, "__description__", projectInfo.description);

        // /*_xxx_*/
        function handleBlock(content, blockName, handler) {
            let split = content.split("/*_"+blockName+"Start_*/");
            switch (split.length) {
                case 2:  break;
                case 1:  reject("Template error:<br>\""+blockName+"\" start block not found");
                default: reject("Template error:<br>more than one \""+blockName+"\" start block is found");
            }
            const beforeBlock = split[0] + "// GENERATED BLOCK START: " + blockName;
            split = split[1].split("/*_"+blockName+"End_*/");
            switch (split.length) {
                case 2:  break;
                case 1:  reject("Template error:<br>\""+blockName+"\" end block not found");
                default: reject("Template error:<br>more than one \""+blockName+"\" end block is found");
            }
            let blockFormat = split[0];
            // remove a extra line
            let arr = blockFormat.split('\n');
            const space = arr.pop();
            blockFormat = arr.join('\n');
            // ---
            const afterBlock = "\n" + space + "// GENERATED BLOCK END:   " + blockName + split[1];
            handler(beforeBlock, blockFormat, afterBlock);
        }
        handleBlock(content, "propertyDefaultValue", function(beforeBlock, blockFormat, afterBlock){
            for (name in properties) {
                const property = getFixedProperty(name);
                beforeBlock += replace_all2(blockFormat, {
                    "_type_": property.type,
                    "_name_": name,
                    "_defaultValue_": property.defaultValue
                });
            }
            content = beforeBlock + afterBlock;
        });
        handleBlock(content, "propertyField", function(beforeBlock, blockFormat, afterBlock){
            for (name in properties) {
                const property = getFixedProperty(name);
                beforeBlock += replace_all2(blockFormat, {
                    "_type_": property.type,
                    "_name_": name
                });
            }
            content = beforeBlock + afterBlock;
        });
        handleBlock(content, "property", function(beforeBlock, blockFormat, afterBlock){
            for (name in properties) {
                const property = getFixedProperty(name);
                beforeBlock += replace_all2(blockFormat, {
                    "_description_": property.description,
                    "_category_": property.category,
                    "_if_designerVisible": property.designerVisible ? "" : "//",
                    "_setterUserVisible_": property.setterUserVisible,
                    "_editorType_": property.editorType,
                    "_args_": property.args,
                    "_type_": property.type,
                    "_name_": name,
                    "_getterUserVisible_": property.getterUserVisible
                });
            }
            content = beforeBlock + afterBlock;
        });

        executor(javaHead + content);
    });
}

/**
 * 
 * @param {function} callback like: function(data){}
 * @return nothing, data would be return by callback
 */
function getTemplate() {
    // case "Default"
    if ($("#field_template_radio1").prop("checked")) {
        if (TEMPLATE_DEFAULT==null) {
            throw "default template not ready yet";
        }
        return TEMPLATE_DEFAULT;
    
    // case "Import"
    } else if ($("#field_template_radio2").prop("checked")) {
        if (TEMPLATE_IMPORT==null) {
            throw "imported template not ready yet";
        }
        return TEMPLATE_IMPORT;
    }
}

/**
 * get a certain property and fix all the values. If any of the value does not exist, fill it with default value.
 * @param {string} name 
 */
function getFixedProperty(name) {
    return {
        name: name,
        args: properties[name].args ? properties[name].args : "{}",
        type: properties[name].type ? properties[name].type : "String",
        category: properties[name].category ? properties[name].category : "UNSET",
        editorType: properties[name].editorType ? properties[name].editorType : "text",
        description: properties[name].description ? properties[name].description : "",
        defaultValue: properties[name].defaultValue ? properties[name].defaultValue : "\"\"",
        designerVisible: typeof(properties[name].designerVisible)=="boolean"
            ? properties[name].designerVisible : true,
        getterUserVisible: typeof(properties[name].getterUserVisible)=="boolean"
            ? properties[name].getterUserVisible : true,
        setterUserVisible: typeof(properties[name].setterUserVisible)=="boolean"
            ? properties[name].setterUserVisible : true,
    };
}
function setProprtyToModal(property) {
    $("#property_name").val(property.name);
    $("#property_designerVisible").prop("checked", property.designerVisible);
    $("#property_designerVisible").change();
    $("#property_editorType").val(property.editorType);
    $("#property_setterUserVisible").prop("checked", property.setterUserVisible);
    $("#property_getterUserVisible").prop("checked", property.getterUserVisible);
    $("#property_category").val(property.category);
    $("#property_description").val(property.description);
    $("#property_type").val(property.type);
    $("#property_default").val(property.defaultValue);
}
function getPropertyFromModal() {
    return {
        name: $("#property_name").val(),
        type: $("#property_type").val(),
        category: $("#property_category").val(),
        editorType: $("#property_editorType").val(),
        description: $("#property_description").val(),
        defaultValue: $("#property_default").val(),
        designerVisible: $("#property_designerVisible").prop("checked"),
        getterUserVisible: $("#property_getterUserVisible").prop("checked"),
        setterUserVisible: $("#property_setterUserVisible").prop("checked"),
    };
}
function refreshPropertyDropdown() {
    const select = $("#field_properties_select");
    const val = select.val();
    select.empty();
    if (Object.size(properties)==0) {
        select.append("<option>None</option>");
        select.val("None");
        $("#field_properties_edit").prop("disabled", true);
        $("#field_properties_remove").prop("disabled", true);
        return;
    }
    for (name in properties) {
        let option = $("<option></option>");
        option.text(name);
        select.append(option);
    }
    if (val in properties) {
        select.val(val);
    }
    $("#field_properties_edit").prop("disabled", false);
    $("#field_properties_remove").prop("disabled", false);
}

/**
 * get file async
 * @param {string} url 
 * @returns promise
 */
function getFile(url) {
    // would not work for chrome locally (since url is file:///..)
    // so try the following codes to run a local html server
    // "python -m http-server" (for py3)  OR  "python -m SimpleHTTPServer" (for py2)
    return new Promise(function (executor, reject){
        $.ajax({
            async: true,
            url: url,
            dataType: "text",
            success: function (results){
                executor(results);
            },
            error: function() {
                reject("fail loading by ajax: " + url);
            }
        });
    })
}

/**
 * @param {string} text 
 * @param {string} oldText 
 * @param {string} newText 
 */
function replace_all(text, oldText, newText){
    return text.split(oldText).join(newText);
}
/**
 * 
 * @param {string} text 
 * @param {object} obj require a object like {"oldText": "newText"}
 */
function replace_all2(text, obj) {
    for (let oldText in obj) {
        text = replace_all(text, oldText, obj[oldText]);
    }
    return text;
}

/**
 * modified from https://www.w3schools.com/howto/howto_js_autocomplete.asp
 * 
 * @param {string} inputBox id of inputBox, jquery node also allowed
 * @param {string[]} choices array of string of choices
 */
function autocomplete(inputBox, choices) {
    if (typeof(inputBox)=="string") {
        inputBox = $("#"+inputBox);
    }
    if (!choices) {
        choices = inputBox.attr("autocompleteItems").split(",");
    }
    if (!choices) {
        return;
    }
    let currentFocus;
    inputBox.on("input focusin", function(){
        const val = $(this).val();
        closeAllLists();
        currentFocus = -1;
        let list = $("<div></div>");
        list.attr("id", $(this).attr("id")+"autocomplete-list");
        list.addClass("autocomplete-items");
        list.appendTo($(this).parent());
        let unhighlighted = [];
        for (let i in choices) {
            if (choices[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                let item = $("<div></div>");
                item.append("<strong>"+choices[i].substr(0,val.length)+"</strong>", choices[i].substr(val.length));
                item.attr("value", choices[i]);
                list.append(item);
            } else {
                unhighlighted.push(choices[i]);
            }
        }
        for (let j in unhighlighted) {
            let item = $("<div></div>");
            item.append(unhighlighted[j]);
            item.attr("value", unhighlighted[j]);
            list.append(item);
        }
        list.children().each(function(){
            $(this).click(function() {
                inputBox.val($(this).attr("value"));
                closeAllLists();
            });
        });
    });
    inputBox.on("keydown", function(e) {
        let x = $("#" + $(this).attr("id") + "autocomplete-list").find("div");
        if (e.keyCode == 40) { // arrow DOWN
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // arrow UP
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // ENTER
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) {
                    x[currentFocus].click();
                }
            }
        }
    });
    function addActive(x) {
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
    function removeActive(x) {
        x.each(function(){
            $(this).removeClass("autocomplete-active");
        });
    }
    function closeAllLists(elmnt) {
        $(".autocomplete-items").each(function(){
            if (elmnt != $(this)[0] && elmnt != inputBox[0]) {
                $(this).remove();
            }
        });
    }
    $(document).on("click", function (e) {
        closeAllLists(e.target);
    });
    inputBox.on("focusout", function(){
        closeAllLists();
    })
}