<template>
  <div id="content">
    <div id="upload">
      <form id="upload_form" v-on:submit.prevent>
        <!-- UPLOAD .LVG -->
        <label for="upload_file"><b v-t="'content.upload.title'" /></label>
        <b-input-group>
          <b-form-file
              v-model="uploadFile"
              accept=".lvg"
              :placeholder="$t('content.upload.chooseFileHint')"
              :lang="$i18n.locale" />
          <b-input-group-append v-if="Boolean(uploadFile)">
            <b-btn variant="primary" v-b-modal="'upload_confirm'" v-t="'content.upload.applyButtonText'" />
          </b-input-group-append>
        </b-input-group>
        <b-modal
            id="upload_confirm"
            :title="$t('common.confirm')"
            centered
            :ok-title="$t('button.ok')"
            :cancel-title="$t('button.cancel')"
            ok-variant="outline-danger"
            cancel-variant="link"
            @ok="onConfirmUpload">
          {{ $t("content.upload.confirmText") }} <b v-t="'common.wantToContinue'" />
        </b-modal>
      </form>
    </div>

    <hr><br>
      
    <div>
      <form v-on:submit.prevent>
        <label><b v-t="'content.field.title'" /></label>

        <!-- PACKAGE NAME -->
        <b-form-group
            horizontal :label-cols="2"
            :label="$t('content.field.packageName')"
            label-for="field_package_name">
          <b-input-group :append="joinCompNameToPackage ? '.' + componentName.toLowerCase() : ''">
            <b-form-input
                id="field_package_name"
                v-model="packageName"
                placeholder="Package name like com.example.listviews" />
          </b-input-group>
        </b-form-group>

        <!-- APPEND COMPONENT NAME INTO PACKAGE NAME -->
        <b-form-group
            horizontal :label-cols="2"
            label-for="field_package_addCompName">
          <b-form-checkbox
              id="field_package_addCompName"
              v-model="joinCompNameToPackage"
              :value="true" :unchecked-value="false">{{ $t("content.field.packageAddCompName") }}</b-form-checkbox>
        </b-form-group>

        <!-- COMPONENT NAME -->
        <b-form-group
            horizontal :label-cols="2"
            :label="$t('content.field.componentName')"
            label-for="field_componentName">
          <b-form-input
              id="field_componentName"
              v-model="componentName" />
        </b-form-group>

        <!-- DESCRIPTION -->
        <b-form-group
            horizontal :label-cols="2"
            :label="$t('content.field.description')"
            label-for="field_description">
          <b-form-textarea
              id="field_description"
              v-model="description"
              :rows="2" :max-rows="5" />
        </b-form-group>

        <!-- VERSION -->
        <b-form-group
            horizontal :label-cols="2"
            :label="$t('content.field.version')"
            label-for="field_version">
          <b-form-input
              id="field_version"
              type="number"
              v-model="version" />
        </b-form-group>

        <!-- PROPERTIES -->
        <b-form-group
            horizontal :label-cols="2"
            :label="$t('content.field.properties')"
            label-for="field_properties">
          <b-input-group>
            <b-form-select
                id="field_properties"
                v-model="selectedProperty"
                :options="propertyOptions" />
            <b-input-group-append>
              <b-btn
                  variant="outline-secondary"
                  @click="$refs.editPropertyModal.showModal(false, properties[selectedProperty])"
                  :disabled="!properties.hasOwnProperty(selectedProperty)"
                  v-t="'button.edit'" />
              <b-btn
                  variant="outline-danger"
                  @click="onOpenRemovePropertyModal"
                  :disabled="!properties.hasOwnProperty(selectedProperty)"
                  v-t="'button.remove'" />
              <b-btn
                  variant="outline-primary"
                  @click="$refs.editPropertyModal.showModal(true)"
                  v-t="'button.add'" />
            </b-input-group-append>
          </b-input-group>
        </b-form-group>

        <b-modal
            ref="removePropertyModal"
            :title="$t('common.confirm')"
            centered
            :ok-title="$t('button.ok')"
            :cancel-title="$t('button.cancel')"
            ok-variant="outline-danger"
            cancel-variant="link"
            @ok="onRemovePropertyConfirmed">{{ $t("modal.removeProperty.confirm") }}: "<b>{{ selectedProperty2Remove }}"</b></b-modal>
        <EditPropertyModal
            ref="editPropertyModal"
            @ok="onEditPropertyDone" />

        <hr>

        <!-- BUTTONS -->
        <div class="form-group row">
          <div id="field_buttons" class="col-sm-10">
            <b-btn variant="primary" @click="generateCodeZip" v-t="'button.generate'" />
            <span>&nbsp;</span>
            <b-btn variant="default" @click="generateCode" v-t="'button.generateCode'" />
            <span>&nbsp;</span>
            <b-btn
                variant="default"
                v-shortkey="['ctrl','s']" @shortkey="onDownloadProject"
                @click="onDownloadProject"
                v-t="'button.downloadProject'" />
            <span>&nbsp;</span>
            <b-btn variant="danger" v-b-modal="'resetForm_confirm'" v-t="'button.resetForm'" />
          </div>
        </div>
        <JavaPreviewModal
            ref="javaPreviewModal" />
        <b-modal
            id="resetForm_confirm"
            :title="$t('common.confirm')"
            centered
            :ok-title="$t('button.ok')"
            :cancel-title="$t('button.cancel')"
            ok-variant="outline-danger"
            cancel-variant="link"
            @ok="resetForm">{{ $t("content.field.confirmResetText") }} <b v-t="'common.wantToContinue'" /></b-modal>
      </form>
    </div>
  </div>
</template>

<script>
import EditPropertyModal from "./modals/EditPropertyModal";
import JavaPreviewModal from "./modals/JavaPreviewModal";

import fileUtils from "../utils/fileUtils";
import ajaxUtils from "../utils/ajaxUtils";

export default {
  name: "Content",
  components: { EditPropertyModal, JavaPreviewModal },
  data() {
    return {
      packageName: "",
      componentName: "",
      joinCompNameToPackage: false,
      description: "",
      version: 1,
      properties: {},

      uploadFile: null,
      defaultTemplate: null,
      selectedProperty: "None",
      selectedProperty2Remove: null
    }
  },
  computed: {
    fullPackage() {
      return this.packageName + (this.joinCompNameToPackage ? "." + this.componentName.toLowerCase() : "");
    },
    toObject() {
      return {
        projectInfo: {
          fullPackage: this.fullPackage,
          componentName: this.componentName,
          description: this.description,
          version: this.version,
          properties: this.properties
        }
      }
    },
    toZipObject() {
      return {
        "project-info.json": JSON.stringify({
          packageName: this.packageName,
          componentName: this.componentName,
          joinCompNameToPackage: this.joinCompNameToPackage,
          description: this.description,
          version: this.version,
          properties: this.properties
        })
      }
    },
    propertyOptions() {
      return Object.keys(this.properties).length == 0 ? [ "None" ] : Object.keys(this.properties);
    }
  },
  watch: {
    properties(val) {
      let keys = Object.keys(val);
      if (!keys.includes(this.selectedProperty)) {
        this.selectedProperty = keys[0] || "None";
      }
    }
  },
  created() {
    this.resetForm();
    ajaxUtils.getPlainText("./default.template")
    .then(val => {
      this.defaultTemplate = val;
    })
    .catch(e => {
      this.$alertify.error("common.error.loadTemplate");
      console.error("error fetching default template:", e);
    });
  },
  methods: {
    onConfirmUpload() {
      fileUtils.readZip(this.uploadFile).then(zip => {
        zip.file("project-info.json")
        .async("text", metadata => console.log("progression: " + metadata.percent.toFixed(2) + " %"))
        .then(val => {
          let projectInfo = JSON.parse(val);
          this.packageName = projectInfo.packageName;
          this.componentName = projectInfo.componentName;
          this.joinCompNameToPackage = projectInfo.joinCompNameToPackage;
          this.description = projectInfo.description;
          this.version = projectInfo.version;
          this.properties = projectInfo.properties;
        }, err => {
          this.$alertify.error(this.$t("common.error.reading"));
          console.error("error reading project-info.json", err);
        });
      });
    },
    onOpenRemovePropertyModal() {
      this.selectedProperty2Remove = this.selectedProperty;
      this.$refs.removePropertyModal.show();
    },
    onRemovePropertyConfirmed() {
      if (this.selectedProperty2Remove != null) {
        // DO NOT use the following statement since it would not trigger watch
        // delete this.properties[this.selectedProperty2Remove];
        let newProp = {};
        for (let propName in this.properties) {
          if (propName != this.selectedProperty2Remove) {
            newProp[propName] = this.properties[propName];
          }
        }
        this.properties = newProp;
        
        this.selectedProperty2Remove = null;
      }
    },
    /**
     * @for EditPropertyModal
     */
    checkPropertyExist(propertyName) {
      return this.properties.hasOwnProperty(propertyName);
    },
    onEditPropertyDone(property) {
      delete property.isNewProperty;
      let newProp = {...this.properties};
      newProp[property.name] = property;
      this.properties = newProp;

      this.selectedProperty = property.name;
    },
    generateCodeZip() {
      let _object = this.toObject;
      let componentName = this.componentName;
      let fullPackage = this.fullPackage;
      this.$refs.javaPreviewModal.generateCode(this.defaultTemplate, _object)
      .then(val => {
        let codeZipObject = fileUtils.emptyDirZipObject();
        codeZipObject[componentName + ".java"] = val;
        let tmp;
        let packageArr = fullPackage.split('.').reverse();
        for (let i in packageArr) {
          tmp = fileUtils.emptyDirZipObject();
          tmp[packageArr[i]] = codeZipObject;
          codeZipObject = tmp;
        }
        fileUtils.toZip(codeZipObject)
        .then(content => fileUtils.downloadFile(content, componentName +"-sources.zip"));
      });
    },
    generateCode() {
      this.$refs.javaPreviewModal.showModal(this.defaultTemplate, this.toObject);
    },
    onDownloadProject() {
      fileUtils.toZip(this.toZipObject)
      .then(
        zip => fileUtils.downloadFile(
          zip,
          this.fullPackage + "." + this.componentName + "-v" + this.version + ".lvg"
        )
      );
    },
    resetForm() {
      this.packageName = "cn.colintree.aix.template";
      this.componentName = "TemplateListView";
      this.joinCompNameToPackage = true;
      this.description = "This is a template of ListView.";
      this.version = 1;
      this.properties = [];
    }
  }
}
</script>

<style>
#content {
  padding: 5px;
}
@media (min-width: 751px) {
  #content {
    background-color: rgb(243, 243, 243);
    border: solid darkgray 1px;
    padding-top: 15px;
    padding-bottom: 15px;
    padding-left: 20px;
    padding-right: 20px;
  }
}
#field_buttons button {
  margin-top: 4px;
}

.custom-file-input:lang(en)~.custom-file-label::after {
  content: "Browse";
}
.custom-file-input:lang(zh)~.custom-file-label::after {
  content: "浏览";
}
</style>