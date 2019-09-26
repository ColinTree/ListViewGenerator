<template>
  <div id="content">
    <div id="upload">
      <b-form id="upload_form" @submit.prevent>
        <!-- UPLOAD .LVG -->
        <label for="upload_file" style="font-weight: bold" v-t="'content.upload.title'" />
        <b-input-group>
          <b-form-file
              v-model="uploadFile"
              accept=".lvg"
              :placeholder="$t('content.upload.chooseFileHint')"
              :drop-placeholder="$t('content.upload.dropFileHint')"
              :browse-text="$t('button.browse')" />
          <b-input-group-append v-if="Boolean(uploadFile)">
            <b-button variant="primary" v-b-modal.upload_confirm v-t="'content.upload.applyButtonText'" />
          </b-input-group-append>
        </b-input-group>
        <b-modal id="upload_confirm" centered ok-variant="outline-danger" cancel-variant="link" @ok="onConfirmUpload">
          <span slot="modal-title" v-t="'common.confirm'" />
          <span slot="modal-ok" v-t="'button.ok'" />
          <span slot="modal-cancel" v-t="'button.cancel'" />
          <i18n tag="span" path="content.upload.confirmText"><b v-t="'common.wantToContinue'" /></i18n>
        </b-modal>
      </b-form>
    </div>

    <hr>

    <div>
      <b-form @submit.prevent>
        <label style="font-weight: bold" v-t="'content.field.title'" />

        <!-- PACKAGE NAME -->
        <b-form-group :label-cols="2">
          <span slot="label" v-t="'content.field.packageName'" />
          <b-input-group :append="joinCompNameToPackage ? `.${componentName.toLowerCase()}` : ''">
            <b-input v-model="packageName" :placeholder="$t('content.field.packageNamePlaceHolder')" />
          </b-input-group>
        </b-form-group>

        <!-- APPEND COMPONENT NAME INTO PACKAGE NAME -->
        <b-form-group :label-cols="2">
          <b-checkbox v-model="joinCompNameToPackage">
            <span v-t="'content.field.packageAddCompName'" />
          </b-checkbox>
        </b-form-group>

        <!-- COMPONENT NAME -->
        <b-form-group :label-cols="2">
          <span slot="label" v-t="'content.field.componentName'" />
          <b-input v-model="componentName" />
        </b-form-group>

        <!-- DESCRIPTION -->
        <b-form-group :label-cols="2">
          <span slot="label" v-t="'content.field.description'" />
          <b-textarea v-model="description" :rows="2" :max-rows="5" />
        </b-form-group>

        <!-- VERSION -->
        <b-form-group :label-cols="2">
          <span slot="label" v-t="'content.field.version'" />
          <b-input type="number" v-model="version" />
        </b-form-group>

        <!-- PROPERTIES -->
        <b-form-group :label-cols="2">
          <span slot="label" v-t="'content.field.properties'" />
          <b-input-group>
            <b-select v-model="selectedProperty" :options="propertyOptions" />
            <b-input-group-append>
              <b-button
                  variant="outline-secondary"
                  :disabled="!(selectedProperty in properties)"
                  @click="onEditProperty(selectedProperty)"
                  v-t="'button.edit'" />
              <b-button
                  variant="outline-danger"
                  :disabled="!(selectedProperty in properties)"
                  @click="onOpenRemovePropertyModal"
                  v-t="'button.remove'" />
              <b-button
                  variant="outline-primary"
                  @click="onCreateProperty"
                  v-t="'button.add'" />
            </b-input-group-append>
          </b-input-group>
        </b-form-group>

        <b-modal
            id="removePropertyModal"
            centered
            ok-variant="outline-danger"
            cancel-variant="link"
            @ok="onRemovePropertyConfirmed">
          <span slot="modal-title" v-t="'common.confirm'" />
          <span slot="modal-ok" v-t="'button.ok'" />
          <span slot="modal-cancel" v-t="'button.cancel'" />
          <i18n tag="span" path="modal.removeProperty.confirm"><b v-text="selectedProperty4Remove" /></i18n>
        </b-modal>

        <EditPropertyModal ref="editPropertyModal" @ok="onEditPropertyDone" />

        <hr>

        <!-- ITEM LAYOUT -->
        <b-form-group :label-cols="2">
          <span slot="label" v-t="'content.field.itemLayout'" />
          <label style="color: gray" v-text="itemLayoutFile.name" />
          <b-button variant="link" @click="onManageItemLayout" v-t="'button.manage'" />
        </b-form-group>

        <ManageItemLayoutModal ref="manageItemLayoutModal" @ok="onManageItemLayoutDone" />

        <hr>

        <!-- BUTTONS -->
        <b-form-group>
          <b-button variant="primary" @click="generateCodeZip" v-t="'button.generate'" />
          <b-button variant="default" style="margin-left: 4px" @click="generateCode" v-t="'button.generateCode'" />
          <b-button
              variant="default"
              style="margin-left: 4px"
              v-shortkey="['ctrl','s']"
              @click="onDownloadProject"
              @shortkey="onDownloadProject"
              v-t="'button.downloadProject'" />
          <b-button variant="danger" style="margin-left: 4px" v-b-modal.resetForm_confirm v-t="'button.resetForm'" />
        </b-form-group>

        <JavaPreviewModal ref="javaPreviewModal" />

        <b-modal id="resetForm_confirm" centered ok-variant="outline-danger" cancel-variant="link" @ok="resetForm">
          <span slot="modal-title" v-t="'common.confirm'" />
          <span slot="modal-ok" v-t="'button.ok'" />
          <span slot="modal-cancel" v-t="'button.cancel'" />
          <span v-t="'content.field.confirmResetText'" />
          <b v-t="'common.wantToContinue'" />
        </b-modal>

      </b-form>
    </div>
  </div>
</template>

<script lang="ts">
import Lodash from 'lodash';
import { Component, Vue, Watch } from 'vue-property-decorator';

import EditPropertyModal from './modals/EditPropertyModal.vue';
import JavaPreviewModal from './modals/JavaPreviewModal.vue';
import ManageItemLayoutModal from './modals/ManageItemLayoutModal.vue';

import { AiaScmFile, EmptyAiaScmFile, LvgItemLayout, LvgPlainItemLayout,
         LvgProjectObject, LvgProjectZipInfo, LvgProperty } from '../typings/lvg';
import AjaxUtils from '../utils/AjaxUtils';
import FileUtils from '../utils/FileUtils';

interface Properties { [key: string]: LvgProperty; }
function newEmptyFile () { return new File([], ''); }

@Component({ components: { EditPropertyModal, ManageItemLayoutModal, JavaPreviewModal } })
export default class Content extends Vue implements LvgProjectZipInfo, LvgProjectObject {
  public $refs!: {
    editPropertyModal: EditPropertyModal;
    manageItemLayoutModal: ManageItemLayoutModal;
    javaPreviewModal: JavaPreviewModal;
  };

  public packageName = '';
  public joinCompNameToPackage = false;
  public componentName = '';
  public description = '';
  public version = 1;
  public properties = {} as Properties;
  public itemLayout = EmptyAiaScmFile();

  private uploadFile: File | null = null;
  private selectedProperty = 'None';
  private selectedProperty4Remove: null | string = null;
  private itemLayoutFile = newEmptyFile();

  public get fullPackage () {
    if (this.joinCompNameToPackage) {
      return `${this.packageName}.${this.componentName.toLowerCase()}`;
    }
    return this.packageName;
  }
  public get itemLayoutFileName () {
    return this.itemLayoutFile.name;
  }
  public get plainItemLayoutComponents () {
    if (Lodash.isEqual(this.itemLayout, EmptyAiaScmFile())) {
      return {};
    }
    const result = {} as { [name: string]: LvgPlainItemLayout };
    function traverseComponentContainer (compProps: LvgItemLayout, isForm = false) {
      if (!isForm) {
        if (compProps.$Components === undefined) {
          result[compProps.$Name] = Lodash.clone(compProps) as LvgPlainItemLayout;
        } else {
          result[compProps.$Name] = Lodash.mapValues(compProps, (val, key) =>
              key === '$Components' && val !== undefined
              ? (val as LvgItemLayout[]).map(value => value.$Name)
              : val);
        }
      }
      if (compProps.$Components !== undefined) {
        compProps.$Components.forEach(child => traverseComponentContainer(child));
      }
    }
    traverseComponentContainer(this.itemLayout.Properties, true);
    return result;
  }

  private get propertyOptions () {
    const keys = Object.keys(this.properties);
    return keys.length === 0 ? [ 'None' ] : keys;
  }

  /**
   * @for EditPropertyModal
   */
  public checkPropertyExist (propertyName: string) {
    return this.properties.hasOwnProperty(propertyName);
  }

  @Watch('properties')
  private onPropertiesChanged (val: Properties) {
    const keys = Object.keys(val);
    if (!keys.includes(this.selectedProperty)) {
      this.selectedProperty = keys[0] || 'None';
    }
  }

  private async created () {
    this.resetForm();
  }

  private async onConfirmUpload () {
    if (this.uploadFile === null) {
      return;
    }
    const zip = await FileUtils.readZip(this.uploadFile);
    try {
      const val = await zip.file('project-info.json').async('text');
      const projectInfo = JSON.parse(val) as LvgProjectZipInfo;

      this.packageName = Lodash.defaultTo(projectInfo.packageName, '');
      this.componentName = Lodash.defaultTo(projectInfo.componentName, '');
      this.joinCompNameToPackage = Lodash.defaultTo(projectInfo.joinCompNameToPackage, true);
      this.description = Lodash.defaultTo(projectInfo.description, '');
      this.version = Lodash.defaultTo(projectInfo.version, 1);
      this.properties = Lodash.defaultTo(projectInfo.properties, {});

      const itemLayoutFileName = projectInfo.itemLayoutFileName;
      if (!itemLayoutFileName) {
        this.itemLayoutFile = newEmptyFile();
        return;
      }
      const itemLayoutFileInZip = zip.file(itemLayoutFileName);
      if (itemLayoutFileInZip === null) {
        throw new Error('unable to find itemLayout file in project');
      }

      const itemLayoutBlobFromAia = await itemLayoutFileInZip.async('blob');
      this.itemLayoutFile = new File([ itemLayoutBlobFromAia ], itemLayoutFileName,
          { type: itemLayoutBlobFromAia.type, lastModified: Date.now() });
      this.loadItemLayout();
    } catch (err) {
      this.$alertify.error(this.$t('common.error.reading'));
      console.error('error reading project-info.json', err);
    }
  }
  private onOpenRemovePropertyModal () {
    this.selectedProperty4Remove = this.selectedProperty;
    this.$bvModal.show('removePropertyModal');
  }
  private onRemovePropertyConfirmed () {
    if (this.selectedProperty4Remove != null) {
      const newProp: Properties = Lodash.cloneDeep(this.properties);
      delete newProp[this.selectedProperty4Remove];
      this.properties = newProp;
      this.selectedProperty4Remove = null;
    }
  }
  private onEditProperty (propertyName: string) {
    this.$refs.editPropertyModal.showModal(false, this.properties[propertyName]);
  }
  private onCreateProperty () {
    this.$refs.editPropertyModal.showModal(true);
  }
  private onEditPropertyDone (isNewProperty: boolean, property: LvgProperty) {
    const newProp = Lodash.cloneDeep(this.properties);
    newProp[property.name] = property;
    this.properties = newProp;
    this.selectedProperty = property.name;
  }
  private onManageItemLayout () {
    this.$refs.manageItemLayoutModal.showModal(this.itemLayoutFile);
  }
  private onManageItemLayoutDone (itemLayoutFile: File) {
    this.itemLayoutFile = itemLayoutFile;
    this.loadItemLayout();
  }

  private async loadItemLayout () {
    if (this.itemLayoutFile == null) {
      throw new Error('unable to load itemLayout from null aia');
    }
    const zip = await FileUtils.readZip(this.itemLayoutFile);
    const res = zip.folder('src').filter(relativePath => relativePath.endsWith('Screen1.scm'));
    if (res.length === 0) {
      throw new Error('No Screen1.scm in itemLayout aia');
    }
    let fileContent = await res[0].async('text');
    fileContent = fileContent.substring(fileContent.indexOf('{'), fileContent.lastIndexOf('}') + 1);
    this.itemLayout = JSON.parse(fileContent) as AiaScmFile;
  }
  private async generateCodeZip () {
    const val = await this.$refs.javaPreviewModal.generateCode(this);
    let codeZipObject = FileUtils.emptyDirZipObject();
    codeZipObject[`${this.componentName}.java`] = val;
    let tmp;
    const packageArr = this.fullPackage.split('.').reverse();
    packageArr.forEach(pkg => {
      tmp = FileUtils.emptyDirZipObject();
      tmp[pkg] = codeZipObject;
      codeZipObject = tmp;
    });
    FileUtils.downloadFile(await FileUtils.toZip(codeZipObject), `${this.componentName}-sources.zip`);
  }
  private generateCode () {
    this.$refs.javaPreviewModal.showModal(this);
  }
  private async onDownloadProject () {
    const zipObject = FileUtils.emptyDirZipObject();
    const projectInfo: LvgProjectZipInfo = {
      packageName: this.packageName,
      componentName: this.componentName,
      joinCompNameToPackage: this.joinCompNameToPackage,
      version: this.version,
      description: this.description,
      properties: this.properties,
      itemLayoutFileName: this.itemLayoutFileName,
    };
    zipObject['project-info.json'] = JSON.stringify(projectInfo);
    if (this.itemLayoutFileName.length > 0) {
      zipObject[this.itemLayoutFileName] = this.itemLayoutFile;
    }
    const DOWNLOAD_FILE_NAME = `${this.fullPackage}.${this.componentName}-v${this.version}.lvg`;
    FileUtils.downloadFile(await FileUtils.toZip(zipObject), DOWNLOAD_FILE_NAME);
  }
  private resetForm () {
    this.packageName = 'cn.colintree.aix.template';
    this.componentName = 'TemplateListView';
    this.joinCompNameToPackage = true;
    this.description = 'This is a template of ListView.';
    this.version = 1;
    this.properties = {};
    this.itemLayoutFile = newEmptyFile();
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
</style>