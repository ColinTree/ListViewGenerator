"use strict";

class LvgProperty {

    constructor(
            name = "", type = "String", category = "UNSET", editorType = "text",
            description = "", defaultValue = "\"\"", designerVisible = true,
            getterUserVisible = true, setterUserVisible = true) {
        this.name = name;
        this.type = type;
        this.category = category;
        this.editorType = editorType;
        this.description = description;
        this.defaultValue = defaultValue;
        this.designerVisible = designerVisible;
        this.getterUserVisible = getterUserVisible;
        this.setterUserVisible = setterUserVisible;
        this.args = {};
    }
    static getDefault(fillin) {
        if (typeof(fillin)!="object") {
            fillin = {};
        }
        return new LvgProperty(
            typeof(fillin.name)=="string" ? fillin.name : "",
            typeof(fillin.type)=="string" ? fillin.type : "String",
            typeof(fillin.category)=="string" ? fillin.category : "UNSET",
            typeof(fillin.editorType)=="string" ? fillin.editorType : "text",
            typeof(fillin.description)=="string" ? fillin.description : "",
            typeof(fillin.defaultValue)=="string" ? fillin.defaultValue : "\"\"",
            typeof(fillin.designerVisible)=="boolean" ? fillin.designerVisible : true,
            typeof(fillin.getterUserVisible)=="boolean" ? fillin.getterUserVisible : true,
            typeof(fillin.setterUserVisible)=="boolean" ? fillin.setterUserVisible : true,
        );
    }

    setModal() {
        $("#property_name").val(this.name).removeValidity("property_name");
        $("#property_designerVisible").checked(this.designerVisible).removeValidity("property_designerVisible").change();
        $("#property_editorType").val(this.editorType).removeValidity("property_editorType");
        $("#property_setterUserVisible").checked(this.setterUserVisible).removeValidity("property_setterUserVisible");
        $("#property_getterUserVisible").checked(this.getterUserVisible).removeValidity("property_getterUserVisible");
        $("#property_category").val(this.category).removeValidity("property_category");
        $("#property_description").val(this.description).removeValidity("property_description");
        $("#property_type").val(this.type).removeValidity("property_type");
        $("#property_default").val(this.defaultValue).removeValidity("property_default");
    }
    static getModal() {
        return new LvgProperty(
            $("#property_name").val(),
            $("#property_type").val(),
            $("#property_category").val(),
            $("#property_editorType").val(),
            $("#property_description").val(),
            $("#property_default").val(),
            $("#property_designerVisible").prop("checked"),
            $("#property_getterUserVisible").prop("checked"),
            $("#property_setterUserVisible").prop("checked")
        );
    }

    toObject() {
        return {
            name: this.name,
            type: this.type,
            category: this.category,
            editorType: this.editorType,
            description: this.description,
            defaultValue: this.defaultValue,
            designerVisible: this.designerVisible,
            getterUserVisible: this.getterUserVisible,
            setterUserVisible: this.setterUserVisible,
            args: this.args
        }
    }
}

class LvgTemplate {

    constructor(content = null) {
        this.type = content ? "custom" : "default";
        this.private_content = content ? content : "";
    }

    get isDefault() {
        return this.type=="default";
    }
    get content() {
        return this.isDefault ? LvgTemplate.DEFAULT_TEMPLATE : this.private_content;
    }

    setForm() {
        $("#field_template_default_radio").checked(this.isDefault);
        $("#field_template_custom_radio").checked(!this.isDefault);
        if (! this.isDefault) {
            $("#field_template_custom_radio").change();
            $("#field_template_file").change(null);
        }
    }

    toObject() {
        return {
            type: this.type,
            content: this.isDefault ? "" : this.content
        }
    }
}

class LvgProject {

    constructor(
            package_ = "", componentName = "", joinCompNameToPackage = true, description = "",
            version = 1, template = new LvgTemplate(), properties = {}) {
        this.package = package_;
        this.componentName = componentName;
        this.joinCompNameToPackage = joinCompNameToPackage;
        this.description = description;
        this.version = version;
        this.template = template;
        this.properties = typeof(properties)=="object" ? properties : {};
    }
    static getDefault(fillin) {
        if (typeof(fillin)!="object") {
            fillin = {};
        }
        return new LvgProject(
            typeof(fillin.package)=="string" ? fillin.package : "cn.colintree.aix.template",
            typeof(fillin.componentName)=="string" ? fillin.componentName : "TemplateListView",
            typeof(fillin.joinCompNameToPackage)=="boolean" ? fillin.joinCompNameToPackage : true,
            typeof(fillin.description)=="string" ? fillin.description : "This is a template of ListView.",
            typeof(fillin.version)=="number" ? fillin.version : 1,
            typeof(fillin.template)=="object" && fillin.template!=undefined ? fillin.template : new LvgTemplate(),
            typeof(fillin.properties)=="object" && fillin.properties!=undefined ? fillin.properties : {
                "name": new LvgProperty("name")
            }
        );
    }

    get fullPackage() {
        return this.joinCompNameToPackage
             ? this.package + '.' + this.componentName
             : this.package;
    }

    setForm() {
        $("#field_package").val(this.package);
        $("#field_package_addCompName").checked(this.joinCompNameToPackage);
        $("#field_componentName").val(this.componentName);
        $("#field_description").val(this.description);
        $("#field_version").val(this.version);
        this.template.setForm();
        this.setPropertyDropdown();
    }

    /**
     * @param {object} zipObject An object like: {
     *     "path-to-file1": "file1-content",
     *     "path-to-file2": "file2-content"
     * }
     */
    static fromZipObject(zipObject) {
        const projectInfo = zipObject.hasOwnProperty("project-info.json") ? JSON.parse(zipObject["project-info.json"]): {};
        if (projectInfo.hasOwnProperty("template")) {
            let temp = projectInfo.template;
            projectInfo.template = new LvgTemplate(temp.hasOwnProperty("content") && temp.content ? temp.content : "");
        }
        if (projectInfo.hasOwnProperty("properties")) {
            let prop = projectInfo.properties;
            projectInfo.properties = {};
            if (typeof(prop)=="object") {
                for (name in prop) {
                    projectInfo.properties[name] = LvgProperty.getDefault(prop[name]);
                }
            }
        }
        return LvgProject.getDefault(projectInfo);
    }

    toZipObject() {
        return {
            "project-info.json": JSON.stringify({
                package: this.package,
                componentName: this.componentName,
                joinCompNameToPackage: this.joinCompNameToPackage,
                description: this.description,
                version: this.version,
                template: this.template.toObject(),
                properties: 
                    ((properties) => {
                        let prop = {};
                        for (name in properties) {
                            prop[name] = properties[name].toObject();
                        }
                    })(this.properties)
                })
        };
    }

    setPropertyDropdown(selectName) {
        const select = $("#field_properties_select");
        const val = select.val();
        select.empty();
        if (Object.size(this.properties)==0) {
            select.append("<option>None</option>");
            select.val("None");
            $("#field_properties_edit").disabled(true);
            $("#field_properties_remove").disabled(true);
            return;
        }
        for (name in this.properties) {
            let option = $("<option></option>");
            option.text(name);
            select.append(option);
        }
        if (val in this.properties) {
            select.val(val);
        }
        if (typeof(selectName)=="string" && selectName in this.properties) {
            select.val(selectName);
        }
        $("#field_properties_edit").disabled(false);
        $("#field_properties_remove").disabled(false);
    }

    // replace /*_xxx_*/
    static handleBlock(content, blockName, reject, handler) {
        let split = content.split("/*_"+blockName+"Start_*/");
        switch (split.length) {
            case 2:  break;
            case 1:  return reject("Template error: \""+blockName+"\" start block not found");
            default: return reject("Template error: more than one \""+blockName+"\" start block is found");
        }
        const beforeBlock = split[0] + "/* GENERATED BLOCK START: " + blockName + " */";
        split = split[1].split("/*_"+blockName+"End_*/");
        switch (split.length) {
            case 2:  break;
            case 1:  return reject("Template error: \""+blockName+"\" end block not found");
            default: return reject("Template error: more than one \""+blockName+"\" end block is found");
        }
        let blockFormat = split[0];
        const afterBlock = "/* GENERATED BLOCK END:   " + blockName + " */" + split[1];
        handler(beforeBlock, blockFormat, afterBlock);
    }

    generateCode() {
        const this_ = this;
        return new Promise((executor, reject) => {
            let generateInfo = ""
            + "/**\n"
            + " * This file is generated by ListView Generator(v"+LVG_VERSION+") by ColinTree\n"
            + " * Find more infomation on github: https://github.com/ColinTree/ListViewGenerator \n"
            + " * Generate time: " + new Date(Date.now()) + '\n'
            + " * Browser: " + navigator.userAgent + '\n'
            + " * Location: " + window.location + '\n'
            + " */\n";
    
            let content = this_.template.content;
            // replace __xxx__
            content = String.replaceAll(content, "__componentName__", this_.componentName);
            content = String.replaceAll(content, "__version__", this_.version);
            content = String.replaceAll(content, "__full_package__", this_.fullPackage);
            content = String.replaceAll(content, "__description__", this_.description);
    
            LvgProject.handleBlock(content, "propertyDefaultValue", reject, (beforeBlock, blockFormat, afterBlock) => {
                for (name in this_.properties) {
                    const property = this_.properties[name].toObject();
                    beforeBlock += String.replaceAll2(blockFormat, {
                        "_type_": property.type,
                        "_name_": name,
                        "_defaultValue_": property.defaultValue
                    });
                }
                content = beforeBlock + afterBlock;
            });
            LvgProject.handleBlock(content, "propertyField", reject, (beforeBlock, blockFormat, afterBlock) => {
                for (name in this_.properties) {
                    const property = this_.properties[name].toObject();
                    beforeBlock += String.replaceAll2(blockFormat, {
                        "_type_": property.type,
                        "_name_": name
                    });
                }
                content = beforeBlock + afterBlock;
            });
            LvgProject.handleBlock(content, "property", reject, (beforeBlock, blockFormat, afterBlock) => {
                for (name in this_.properties) {
                    const property = this_.properties[name].toObject();
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
    }

}