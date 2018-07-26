/**
 * depends: (Promise, FileReader), jquery, jszip, FileSaver.js, clipboard.js, alertify.js
 */
'use strict';

const LVG_VERSION = "er: alpha"; //will be joined as "ver: alpha"

let Project = {};
Project.Property = {};
Project.TEMPLATE_DEFAULT;
Project.TEMPLATE_IMPORT;

let Property = Project.Property;
Property.properties = {};

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

String.replaceAll = function(text, oldText, newText){
    return text.split(oldText).join(newText);
};
/**
 * @param {string} text 
 * @param {object} obj require a object like {"oldText": "newText"}
 */
String.replaceAll2 = function(text, obj) {
    for (let oldText in obj) {
        text = String.replaceAll(text, oldText, obj[oldText]);
    }
    return text;
};

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
    /**
     * modified from https://www.w3schools.com/howto/howto_js_autocomplete.asp
     * 
     * @param {string[]} choices array of string of choices
     */
    autocomplete: function (choices) {
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
        inputBox.on("input focusin", function(){
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
            list.children().each(function(){
                $(this).click(function() {
                    inputBox.val($(this).attr("value")).change();
                    closeAllLists();
                });
            });
        });
        inputBox.on("keydown", function(e) {
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
        });
        return inputBox;
    }
});

/**
 * @return build projectInfo with current data from fields(the form)
 */
Project.getInfo = function() {
    let projectInfo = {
        package: $("#field_package").val(),
        componentName: $("#field_componentName").val(),
        joinCompNameToPackage: $("#field_package_addCompName").prop("checked"),
        description: $("#field_description").val().replace(new RegExp('\n',"gm"),"\\n"),
        version: Number.parseInt($("#field_version").val()),
        template: $("#field_template_radio1").prop("checked") ? "Default" : "Import",
        templateFileName: $("#field_template_radio1").prop("checked")
            ? "" : $("#field_template_file_label").text(),
        getFullPackage: function() {
            return this.joinCompNameToPackage
                ? this.package + '.' + this.componentName
                : this.package;
        }
        
    };
    if (projectInfo.template=="Import" && !Project.TEMPLATE_IMPORT) {
        projectInfo.template = "Default";
    }
    return projectInfo;
};

/**
 * set projectInfo to current form
 * @param projectInfo 
 */
Project.setInfo = function(projectInfo) {
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
};

Project.getTemplate = function() {
    // case "Default"
    if ($("#field_template_radio1").prop("checked")) {
        if (Project.TEMPLATE_DEFAULT==null) {
            throw "default template not ready yet";
        }
        return Project.TEMPLATE_DEFAULT;
    
    // case "Import"
    } else if ($("#field_template_radio2").prop("checked")) {
        if (Project.TEMPLATE_IMPORT==null) {
            throw "imported template not ready yet";
        }
        return Project.TEMPLATE_IMPORT;
    }
};

/**
 * @param  projectInfo
 * @return java code of the listview
 */
Project.generateCode = function(projectInfo) {
    return new Promise(function(executor, reject){
        let generateInfo = ""
        + "/**\n"
        + " * This file is generated by ListView Generator(v"+LVG_VERSION+") by ColinTree\n"
        + " * Find more infomation on github: https://github.com/ColinTree/ListViewGenerator \n"
        + " * Generate time: " + new Date(Date.now()) + '\n'
        + " * Browser: " + navigator.userAgent + '\n'
        + " * Location: " + window.location + '\n'
        + " */\n";

        let content;
        try {
            content = Project.getTemplate();
        } catch (err) {
            reject(err);
        }
        // replace __xxx__
        content = String.replaceAll(content, "__componentName__", projectInfo.componentName);
        content = String.replaceAll(content, "__version__", projectInfo.version);
        content = String.replaceAll(content, "__full_package__", projectInfo.getFullPackage());
        content = String.replaceAll(content, "__description__", projectInfo.description);

        // replace /*_xxx_*/
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
            for (name in Property.properties) {
                const property = Property.getFixedValue(name);
                beforeBlock += String.replaceAll2(blockFormat, {
                    "_type_": property.type,
                    "_name_": name,
                    "_defaultValue_": property.defaultValue
                });
            }
            content = beforeBlock + afterBlock;
        });
        handleBlock(content, "propertyField", function(beforeBlock, blockFormat, afterBlock){
            for (name in Property.properties) {
                const property = Property.getFixedValue(name);
                beforeBlock += String.replaceAll2(blockFormat, {
                    "_type_": property.type,
                    "_name_": name
                });
            }
            content = beforeBlock + afterBlock;
        });
        handleBlock(content, "property", function(beforeBlock, blockFormat, afterBlock){
            for (name in Property.properties) {
                const property = Property.getFixedValue(name);
                beforeBlock += String.replaceAll2(blockFormat, {
                    "_description_": property.description,
                    "_category_": property.category,
                    "_if_designerVisible_": property.designerVisible ? "" : "//",
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

        executor(generateInfo + content);
    });
};



/**
 * get a certain property and fix all the values. If any of the value does not exist, fill it with default value.
 * @param {string} name 
 */
Property.getFixedValue = function(name) {
    return {
        name: name ? name : "",
        args: Property.properties[name].args ? Property.properties[name].args : "{}",
        type: Property.properties[name].type ? Property.properties[name].type : "String",
        category: Property.properties[name].category ? Property.properties[name].category : "UNSET",
        editorType: Property.properties[name].editorType ? Property.properties[name].editorType : "text",
        description: Property.properties[name].description ? Property.properties[name].description : "",
        defaultValue: Property.properties[name].defaultValue ? Property.properties[name].defaultValue : "\"\"",
        designerVisible: typeof(Property.properties[name].designerVisible)=="boolean"
            ? Property.properties[name].designerVisible : true,
        getterUserVisible: typeof(Property.properties[name].getterUserVisible)=="boolean"
            ? Property.properties[name].getterUserVisible : true,
        setterUserVisible: typeof(Property.properties[name].setterUserVisible)=="boolean"
            ? Property.properties[name].setterUserVisible : true,
    };
};
Property.setToModal = function(property) {
    $("#property_name").val(property.name).removeValidity("property_name");
    $("#property_designerVisible").prop("checked", property.designerVisible).removeValidity("property_designerVisible").change();
    $("#property_editorType").val(property.editorType).removeValidity("property_editorType");
    $("#property_setterUserVisible").prop("checked", property.setterUserVisible).removeValidity("property_setterUserVisible");
    $("#property_getterUserVisible").prop("checked", property.getterUserVisible).removeValidity("property_getterUserVisible");
    $("#property_category").val(property.category).removeValidity("property_category");
    $("#property_description").val(property.description).removeValidity("property_description");
    $("#property_type").val(property.type).removeValidity("property_type");
    $("#property_default").val(property.defaultValue).removeValidity("property_default");
};
Property.getFromModal = function() {
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
};
Property.refreshDropdown = function(selectName) {
    const select = $("#field_properties_select");
    const val = select.val();
    select.empty();
    if (Object.size(Property.properties)==0) {
        select.append("<option>None</option>");
        select.val("None");
        $("#field_properties_edit").prop("disabled", true);
        $("#field_properties_remove").prop("disabled", true);
        return;
    }
    for (name in Property.properties) {
        let option = $("<option></option>");
        option.text(name);
        select.append(option);
    }
    if (val in Property.properties) {
        select.val(val);
    }
    if (typeof(selectName)=="string" && selectName in Property.properties) {
        select.val(selectName);
    }
    $("#field_properties_edit").prop("disabled", false);
    $("#field_properties_remove").prop("disabled", false);
};


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



$(document).ready(function(){
    // load templates
    getFile("./assets/templates/default.template")
    .then(function(content){
        Project.TEMPLATE_DEFAULT = content;
    });

    // upload handlers
    $("#upload_file").change(function(e){
        const files = e.target.files;
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
                Project.setInfo(projectInfo);
                // load imported template
                if (projectInfo.template=="Import") {
                    zip_.file(projectInfo.templateFileName).async("text")
                    .then(function(template){
                        Project.TEMPLATE_IMPORT = template;
                        $("#field_template_file_download").css("display", "flex");
                    });
                }
            });
        } else {
            $("#upload_file_label").text("Choose file");
        }
    });

    // field handlers
    Property.refreshDropdown();
    $('#properties_remove_modal').on('show.bs.modal', function(){
        const name = $("#field_properties_select").val();
        $(this).find('.modal-body b').text(name);
    })
    .on('shown.bs.modal', function(){
        $(this).find(".btn-secondary").focus();
    });
    $("#properties_remove_modal .btn-danger").click(function(){
        const name = $("#field_properties_select").val();
        delete Property.properties[name];
        Property.refreshDropdown();
        $('#properties_remove_modal').modal('hide');
    });

    $('#properties_edit_modal').on('show.bs.modal', function(event){
        let action = $(event.relatedTarget).data('action');
        $(this).data("mode", action);
        if (action=="add") {
            $(this).find('.modal-title').text("Adding property");
            Property.setToModal({
                category: "UNSET",
                editorType: "text",
                type: "String",
                defaultValue: "\"\""
            }); 
        } else if (action=="edit") {
            $(this).find('.modal-title').text("Editing property");
            const name = $("#field_properties_select").val();
            Property.setToModal(Property.getFixedValue(name));
        }
    })
    .on('shown.bs.modal', function(){
        $("#property_name").focus();
    });
    $("#properties_edit_modal input[type=text]").on("input", function(e){
        $(this).validity(true);
    })
    .on("keydown", function(e){
        if (e.keyCode==13 && !$(this).attr("autocompleteitems")) { // ENTER
            $("#properties_edit_modal .btn-primary").click();
        }
    });
    $("#properties_edit_modal .btn-primary").click(function(){
        const property = Property.getFromModal();
        let valid = true;
        // check fields
        if (!property.name) {
            $("#property_name").validity(false, "Should not be empty");
            valid = false;
        } else if (property.name.includes(" ")) {
            $("#property_name").validity(false, "Should not contain spaces");
            valid = false;
        } else if ($('#properties_edit_modal').data("mode")=="add" && Property.properties.hasOwnProperty(property.name)) {
            $("#property_name").validity(false, "Property existed");
            valid = false;
        } else if (!("ABCDEFGHIJKLMNOPQRSTUVWXYZ_$".includes(property.name.charAt(0).toUpperCase()))) {
            $("#property_name").validity(false, "Should starts with (_$a-zA-Z)");
            valid = false;
        }
        if (!valid) {
            $("#property_name").focus();
        }

        if (!property.type) {
            $("#property_type").validity(false, "Should not be empty");
            if (valid) {
                $("#property_type").focus();
            }
            valid = false;
        }
        if (!property.defaultValue) {
            $("#property_default").validity(false, "Should not be empty");
            if (valid) {
                $("#property_default").focus();
            }
            valid = false;
        } else if (property.type=="String" && !property.defaultValue.includes('"')) {
            $("#property_default").validity(false, "For Java type String, default value should contains quote (\")");
            if (valid) {
                $("#property_default").focus();
            }
            valid = false;
        }

        if (!valid) {
            return false;
        }
        Property.properties[property.name] = property;
        Property.refreshDropdown(property.name);
        $("#properties_edit_modal").modal("hide");
    });

    $("#property_designerVisible").change(function(){
        $("#property_editorType").prop("disabled", !$(this).prop("checked"))
    });
    $("#property_type").autocomplete()
    .on("keydown", function(e){
        if (e.keyCode==13) {
            return false;
        }
    });

    $("#field_template_radio1, #field_template_radio2").change(function(){
        $("#field_template_file").parent().parent().parent()
            .css("display", $("#field_template_radio2").prop("checked") ? "flex" : "none");
    });

    $("#field_template_file").change(function(evt){
        const files = evt.target.files;
        if (files.length == 1) {
            Project.TEMPLATE_IMPORT = null;
            $("#field_template_file_label").text(files[0].name);
            $("#field_template_file_download").css("display", "flex");
            if (!FileReader) {
                return alertify.error("Need a newer browser to support this (FileReader)");
            }
            let reader = new FileReader();
            reader.onload = function(oFREvent) {
                Project.TEMPLATE_IMPORT = oFREvent.target.result;
            }
            reader.readAsText(files[0]);
        } else {
            $("#field_template_file_label").text("Choose file");
            $("#field_template_file_download").hide();
        }
    });
    $("#field_template_file_download_button").click(function(){
        let blob = new Blob([Project.TEMPLATE_IMPORT], {type: "text/plain;charset=utf-8"});
        saveAs(blob, $("#field_template_file_label").text());
    });
    
    $("#field_form").submit(function(){
        return false;
    });
    $("#field_generateCodeZip").click(function(){
        const projectInfo = Project.getInfo();
        generateCode(projectInfo)
        .then(function(javaCode){
            const full_package = projectInfo.getFullPackage();
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
        const projectInfo = Project.getInfo();
        $("#field_java_code_preview").text("generating...");
        Project.generateCode(projectInfo)
        .then(function(javaCode){
            $("#field_java_code_preview").text(javaCode);
            $("#field_java_code").css("display", "flex");
        });
    });
    $("#field_downloadProject").click(function(){
        const projectInfo = Project.getInfo();
        let zip = new JSZip();
        zip.file("project-info.json", JSON.stringify(projectInfo));
        if (projectInfo.template=="Import") {
            let fileName = projectInfo.templateFileName;
            if (!fileName) {
                fileName = "custom.template";
            }
            zip.file(fileName, Project.TEMPLATE_IMPORT);
        }
        zip.generateAsync({type:"blob"})
        .then(function(content) {
            saveAs(content, projectInfo.getFullPackage() + "." + projectInfo.componentName + ".lvg");
        });
    });

    new ClipboardJS('.btn');
});