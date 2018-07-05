'use_strict';

const LVG_VERSION = 1;
var TEMPLATE_DEFAULT;
var TEMPLATE_IMPORT;

/**
 * depends: jquery, jszip, FileSaver.js, clipboard.js
 */

$(document).ready(function(){
    // load templates
    getFile("assets/templates/default.template", function(content){
        TEMPLATE_DEFAULT = content;
    });

    // upload handlers
    $("#upload_file").change(function(evt){
        const files = evt.target.files;
        if (files.length == 1) {
            $("#upload_file_label").text(files[0].name);
            var promise = JSZip.loadAsync(files[0]);
            promise.then(function(zip){
                return zip.file("project-info.json").async("text");
            }).then(function(txt){
                const projectInfo = JSON.parse(txt);
                setProjectInfo(projectInfo);
                // load imported template
                if (projectInfo.template=="Import") {
                    promise.then(function(zip){
                        return zip.file(projectInfo.templateFileName).async("text");
                    }).then(function(template){
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
    var field_template_radio_change = function(){
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
                return alert("Need a newer browser to support this (FileReader)");
            }
            var reader = new FileReader();
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
        var blob = new Blob([TEMPLATE_IMPORT], {type: "text/plain;charset=utf-8"});
        saveAs(blob, $("#field_template_file_label").text());
    });
    
    $("#field_form").submit(function(){
        return false;
    });
    $("#field_generateCodeZip").click(function(){
        const projectInfo = getProjectInfo();
        generateCode(projectInfo, function(javaCode){
            const full_package = getFullPackage(projectInfo);
            var zip = new JSZip();
            var subfolder = zip;
            var packageArr = full_package.split('.');
            for (i in packageArr) {
                subfolder = subfolder.folder(packageArr[i]);
            }
            subfolder.file(projectInfo.componentName + ".java", javaCode);
            zip.generateAsync({type:"blob"}).then(function(content) {
                saveAs(content, projectInfo.componentName +"-sources.zip");
            });
        });
    });
    $("#field_generateCode").click(function(){
        const projectInfo = getProjectInfo();
        $("#field_java_code_preview").text("generating...");
        generateCode(projectInfo, function(javaCode){
            $("#field_java_code_preview").text(javaCode);
            $("#field_java_code").css("display", "flex");
        });
    });
    $("#field_downloadProject").click(function(){
        const projectInfo = getProjectInfo();
        var zip = new JSZip();
        zip.file("project-info.json", JSON.stringify(projectInfo));
        if (projectInfo.template=="Import") {
            var fileName = projectInfo.templateFileName;
            if (!fileName) {
                fileName = "custom.template";
            }
            zip.file(fileName, TEMPLATE_IMPORT);
        }
        zip.generateAsync({type:"blob"}).then(function(content) {
            saveAs(content, getFullPackage(projectInfo) + "." + projectInfo.componentName + ".lvg");
        });
    });

    new ClipboardJS('.btn');
});

/**
 * @return build projectInfo with current data from fields(the form)
 */
function getProjectInfo() {
    var projectInfo = {
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
function generateCode(projectInfo, callback) {
    const full_package = getFullPackage(projectInfo);
    var javaCode = ""
    + "/**\n"
    + " * This file is generated by ListView Generator(v"+LVG_VERSION+") by ColinTree\n"
    + " * Find more infomation on github: https://github.com/ColinTree/ListViewGenerator \n"
    + " */\n";
    // make the floolowing into template file

    const property = {};
    const event = {};
    const elementCreate = {};
    const elementProperty = {};
    
    // We use split & join as replace all
    getTemplate(function(content){
        // __xxx__
        content = content.split("__componentName__").join(projectInfo.componentName);
        content = content.split("__version__").join(projectInfo.version);
        content = content.split("__full_package__").join(getFullPackage(projectInfo));
        content = content.split("__description__").join(projectInfo.description);
        // /*_xxx_*/

        callback(javaCode + content);
    });
}

/**
 * 
 * @param {function} callback like: function(data){}
 * @return nothing, data would be return by callback
 */
function getTemplate(callback) {
    // case "Default"
    if ($("#field_template_radio1").prop("checked")) {
        if (TEMPLATE_DEFAULT==null) {
            alert("default template not ready yet");
        }
        callback(TEMPLATE_DEFAULT);
        return;
    
    // case "Import":
    } else if ($("#field_template_radio2").prop("checked")) {
        if (TEMPLATE_IMPORT==null) {
            alert("imported template not ready yet");
        }
        callback(TEMPLATE_IMPORT);
        return;
    }
}

function getFile(url, callback) {
    // would not work for chrome locally (since url is file:///..)
    // so try the following codes to run a local html server
    // "python -m http-server" (for py3)  OR  "python -m SimpleHTTPServer" (for py2)
    $.ajax({
        async: true,
        url: url,
        dataType: "text",
        success: callback,
        error: function() {
            console.error("fail loading by ajax: "+url);
        }
    });
}