/// <reference path="../../lib/jquery/3.3.1/jquery.js" />
/// <reference path="../../lib/alertify.js/1.0.11/js/alertify.js" />
/// <reference path="../../lib/bootstrap/4.1.1/js/bootstrap.js" />
/// <reference path="../../lib/clipboard.js/2.0.1/clipboard.js" />
/// <reference path="../../lib/FileSaver.js/2014-11-29/FileSaver.js" />
/// <reference path="../../lib/jszip/3.1.5/jszip.js" />
/// <reference path="util.js" />
/// <reference path="project.js" />
/**
 * require: ES2015 support (classes, Promise); FileReader
 * depends: jquery, jszip, FileSaver.js, clipboard.js, alertify.js
 */
'use strict';

const LVG_VERSION = "er: alpha"; //will be joined as "ver: alpha"

let project;

// Check Promise & FileReader availability
if (typeof(Promise)!='function') {
    alert("Please change or upgrade your browser to a newer version (which supports ES2015)! e.g. Chrome 32+");
}
if (typeof(FileReader)!="function") {
    alert("Need a newer browser to support FileReader");
}

$(document).ready(() => {
    // load default template
    $.getFile("./assets/templates/default.template")
    .then((content) => {
        LvgTemplate.DEFAULT_TEMPLATE = content;
    });
    LvgTemplate.CUSTOM_TEMPLATE = "No template applied";

    (LvgProject.resetForm = () => {
        project = LvgProject.getDefault();
        project.setForm();
    })();

    // upload handlers
    $("#upload_file").change(function() {
        if (this.files.length != 1) {
            $("#upload_file_label").text("Choose file");
            $("#upload_file_apply").parent().hide();
            return;
        }
        $("#upload_file_label").text(this.files[0].name);
        $("#upload_file_apply").parent().show();
    });
    $("#upload_file_apply").click(() => {
        const files = $("#upload_file")[0].files;
        alertify.confirm(
            "Applying a project would override what you currently got on this page!<br>" +
            "<b>Do you wish to continue?</b>",
            () => {
                JSZip.loadAsync(files[0])
                .then((zip) => {
                    const zipObject = {};
                    zip.file("project-info.json").async("text")
                    .then((content) => {
                        zipObject["project-info.json"] = content;
                        project = LvgProject.fromZipObject(zipObject);
                        project.setForm();
                    });
                });
            });
        return false;
    });
    // end upload handlers

    // field handlers
    const field_project_binding = {
        "field_package" : "package",
        "field_package_addCompName" : "joinCompNameToPackage",
        "field_componentName" : "componentName",
        "field_description" : "description",
        "field_version" : "version",
    }
    $("#field_form").find("input, textarea").change(function() {
        let id = $(this).attr("id");
        if (id && id in field_project_binding) {
            let type = $(this).attr("type");
            let val = null;
            if (type=="text" || $(this).prop("tagName")=="textarea") {
                val = $(this).val();
            } else if (type == "number") {
                val = Number.parseInt($(this).val());
            } else if (type == "checkbox") {
                val = $(this).checked();
            }
            project[field_project_binding[id]] = val;
        }
    });
    // end field handlers

    // property remove modal handlers:
    $('#properties_remove_modal').on('show.bs.modal', function() {
        const name = $("#field_properties_select").val();
        $(this).find('.modal-body b').text(name);
    }).on("shown.bs.modal", function() {
        $(this).find(".btn-secondary").focus();
    });
    $("#properties_remove_modal .btn-danger").click(() => {
        const name = $("#field_properties_select").val();
        delete project.properties[name];
        project.setPropertyDropdown();
        $('#properties_remove_modal').modal('hide');
    });
    // end property remove modal handlers

    // property edit/add modal handlers:
    $('#properties_edit_modal').on('show.bs.modal', function(event) {
        let action = $(event.relatedTarget).data('action');
        $(this).data("mode", action);
        if (action=="add") {
            $(this).find('.modal-title').text("Adding property");
            LvgProperty.getDefault().setModal();
        } else if (action=="edit") {
            $(this).find('.modal-title').text("Editing property");
            const name = $("#field_properties_select").val();
            project.properties[name].setModal();
        }
    }).on("shown.bs.modal", function() {
        $("#property_name").focus();
    });
    $("#properties_edit_modal input[type=text]").on("input", function() {
        $(this).validity(true);
    }).on("keydown", function(e) {
        if (e.keyCode==13 && !$(this).attr("autocompleteitems")) { // ENTER
            $("#properties_edit_modal .btn-primary").click();
        }
    });
    $("#properties_edit_modal .btn-primary").click(() => {
        const property = LvgProperty.getModal();
        let valid = true;
        // check fields
        if (!property.name) {
            $("#property_name").validity(false, "Should not be empty");
            valid = false;
        } else if (property.name.includes(" ")) {
            $("#property_name").validity(false, "Should not contain spaces");
            valid = false;
        } else if ($('#properties_edit_modal').data("mode")=="add" && project.properties.hasOwnProperty(property.name)) {
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
        project.properties[property.name] = property;
        project.setPropertyDropdown();
        $("#properties_edit_modal").modal("hide");
    });
    $("#property_designerVisible").change(function() {
        $("#property_editorType").disabled(!$(this).checked());
    });
    $("#property_type").autocomplete()
    .on("keydown", (e) => {
        if (e.keyCode==13) {
            return false;
        }
    });
    // end property edit/add modal handlers

    // template switch (via radio) handlers:
    $("#field_template_default_radio, #field_template_custom_radio").click(() => {
        if (!project.template.isDefault) {
            LvgTemplate.CUSTOM_TEMPLATE = project.template.content;
        }
        let isDefault = $("#field_template_default_radio").checked();
        project.template = isDefault
                         ? new LvgTemplate()
                         : new LvgTemplate(LvgTemplate.CUSTOM_TEMPLATE);
        project.template.setForm();
    });
    $("#field_template_custom_download").click(() => {
        let blob = new Blob([project.template.content], {type: "text/plain;charset=utf-8"});
        saveAs(blob, project.template.isDefault ? "default.template" : "custom.template");
    });
    // end template switch (via radio) handlers

    // template upload modal handlers:
    $("#template_upload_file").on("change click", () => {
        $("#template_upload_file").validity(true);
        const files = $("#template_upload_file")[0].files;
        if (files.length == 1) {
            $("#template_upload_file_label").text(files[0].name);
        }
    });
    $("#template_upload_confirm").click(() => {
        const files = $("#template_upload_file")[0].files;
        if (files.length == 1) {
            $("#field_template_file_download").css("display", "flex");
            let reader = new FileReader();
            reader.onload = (e) => {
                $("#field_template_custom_radio").checked(true);
                project.template = new LvgTemplate(e.target.result);
            }
            reader.readAsText(files[0]);
            $("#template_upload_modal").modal("hide");
        } else {
            $("#template_upload_file").validity(false);
        }
        return false;
    });
    // end template upload modal handlers
    
    $("#field_form").submit(() => false);

    $("#field_generateCodeZip").click(() => {
        project.generateCode()
        .then((javaCode) => {
            const fullPackage = project.fullPackage;
            let zip = new JSZip();
            let subfolder = zip;
            let packageArr = fullPackage.split('.');
            for (let i in packageArr) {
                subfolder = subfolder.folder(packageArr[i]);
            }
            subfolder.file(project.componentName + ".java", javaCode);
            zip.generateAsync({type:"blob"})
            .then((content) => {
                saveAs(content, project.componentName +"-sources.zip");
            });
        }).catch((msg) => {
            alertify.error(msg);
        });
    });
    $("#field_generateCode").click(() => {
        $("#javacode_preview_modal").modal("show");
        $("#javacode_modal_preview").text("generating...");
        project.generateCode()
        .then((javaCode) => {
            $("#javacode_modal_preview").textWithLineNum(javaCode);
        }).catch((msg) => {
            $("#javacode_modal_preview").text(msg);
        });
    });
    $("#field_downloadProject").click(() => {
        const zipObject = project.toZipObject();
        let zip = new JSZip();
        for (let fileName in zipObject) {
            zip.file(fileName, zipObject[fileName]);
        }
        zip.generateAsync({type:"blob"})
        .then((content) => {
            saveAs(content, project.fullPackage + "." + project.componentName + ".lvg");
        });
    });
    $("#field_resetForm").click(() => {
        alertify.confirm(
            "Reset the form would wipe all you currently get on this page!<br>" +
            "<b>Do you wish to continue?</b>",
            () => LvgProject.resetForm()
        );
    });

    new ClipboardJS('.btn');

    // bind ctrl + s to download project
    $(window).bind('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (String.fromCharCode(e.which).toLowerCase()) {
                case 's':
                    $("#field_downloadProject").click();
                    return false;
            }
        }
    });
    // Notifier user to save
    $(window).on("beforeunload",
        () => "Your work would not be saved by this webpage, please ensure you had save the .lvg file into you computer.");
});