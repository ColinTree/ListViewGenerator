<template>
  <b-modal
      ref="modal"
      centered
      size="lg"
      ok-variant="primary"
      cancel-variant="secondary"
      @cancel.prevent="onCopy">
    <span slot="modal-title" v-t="'modal.previewJava.title'" />
    <span slot="modal-ok" v-t="'button.dismiss'" />
    <span slot="modal-cancel" v-t="'button.copy'" />
    <div ref="codeContainer" class="code-container">
      <highlight-code :code="javaCode" lang="java" />
    </div>
  </b-modal>
</template>

<script lang="ts">
import { BModal } from 'bootstrap-vue';
import JsonToJava from 'json-to-java';
import { Json, JsonArray, JsonObject } from 'json-to-java/bin/utils/json';
import { Component, Vue } from 'vue-property-decorator';

import pkg from '../../../package.json';
import template from '../../java-template.json';

import { GITHUB_REPO_FULL_URL } from '../../const';
import { EmptyAiaScmFile, LvgItemLayout, LvgProjectObject } from '../../typings/lvg';
import FileUtils, { ZipObject } from '../../utils/FileUtils';
import StringUtils from '../../utils/StringUtils';
import { insertConstants, MATCHER_GLOBAL } from './javaCompiler/InsertGlobalConstant';
import { compileTemplates, getCompileDataProvider, TEMPLATE_PATTERN} from './javaCompiler/TemplateCompilers';

@Component
export default class JavaPreviewModal extends Vue {
  public $refs!: {
    modal: BModal;
    codeContainer: HTMLElement;
  };
  private javaCode = '';

  public async showModal (projectObject: LvgProjectObject) {
    this.$refs.modal.show();
    this.javaCode = this.$t('modal.javaPreview.generating') as string;
    try {
      this.javaCode = await this.generateCode(projectObject);
    } catch (err) {
      this.javaCode = this.$t('modal.javaPreview.failedGenerating') + err;
      console.error(err);
    }
  }
  public async generateCode (projectObject: LvgProjectObject) {
    let generatedTemplate: JsonObject;
    // insert global constants
    generatedTemplate = insertConstants(template as JsonObject, MATCHER_GLOBAL, {
      lvgVersion: pkg.version,
      githubRepoFullUrl: GITHUB_REPO_FULL_URL,
      generateTime: new Date().toString(),
      browser: navigator.userAgent,
      lvgLocation: window.location,

      fullPackage: projectObject.fullPackage,
      componentName: projectObject.componentName,
      description: projectObject.description,
      version: projectObject.version,
    });
    // compile template
    generatedTemplate =
        compileTemplates(generatedTemplate, TEMPLATE_PATTERN, getCompileDataProvider(projectObject)) as JsonObject;
    console.log('generated template for java compiling', generatedTemplate);
    try {
      return JsonToJava(generatedTemplate);
    } catch (e) {
      throw new Error('Error occured while generating java:\n' + (e as Error).stack);
    }
  }

  private async onCopy () {
    try {
      this.$copyText(this.javaCode, this.$refs.codeContainer);
      this.$alertify.success(this.$t('modal.javaPreview.copied'));
    } catch (e) {
      this.$alertify.error(this.$t('modal.javaPreview.copyFailed'));
    }
  }
}
</script>

<style>
.code-container {
  height: 70vh;
}
.code-container pre {
  height: 100%;
}
.code-container code {
  width: fit-content;
  overflow: unset;
}
</style>