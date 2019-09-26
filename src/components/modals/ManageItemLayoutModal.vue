<template>
  <b-modal
      centered
      ok-variant="primary"
      cancel-variant="outline-secondary"
      no-close-on-backdrop
      no-close-on-esc
      @shown="onShown"
      @ok="onOk"
      @cancel="renderProps = null">
    <span slot="modal-title" v-t="'modal.itemLayout.title'" />
    <span slot="modal-ok" v-t="'button.applyAndClose'" />
    <span slot="modal-cancel" v-t="'button.cancel'" />
    <div ref="renderRoot" class="preview-item-layout">
      <label
          v-if="renderProps === null"
          v-t="'modal.itemLayout.noPreview'" />
      <label v-else v-html="renderProps" /><!-- Dont know why v-text does not work -->
    </div>
    <b-input-group>
      <b-form-file
          accept=".aia"
          v-model="fileSelected"
          :placeholder="$t('content.upload.chooseFileHint')"
          :browse-text="$t('button.browse')" />
      <b-input-group-append v-if="Boolean(fileSelected)">
        <b-btn variant="primary" @click="onApply" v-t="'modal.itemLayout.previewButtonText'" />
      </b-input-group-append>
    </b-input-group>
  </b-modal>
</template>

<script lang="ts">
import { BModal } from 'bootstrap-vue';
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class ManageItemLayoutModal extends Vue {
  private itemLayoutFile: File | null = null;
  private fileSelected: File | null = null;
  private renderProps: string | null = null;

  public showModal (itemLayoutFile: File) {
    (this.$children[0] as BModal).show();
    this.itemLayoutFile = itemLayoutFile;
  }

  private renderProperties () {
    this.renderProps = null;
    if (this.itemLayoutFile === null) {
      return;
    }
    // Read file
    this.renderProps = this.itemLayoutFile.name;
  }

  private onShown () {
    this.renderProperties();
  }
  private onApply () {
    this.itemLayoutFile = this.fileSelected;
    this.renderProperties();
  }
  private onOk () {
    this.$emit('ok', this.itemLayoutFile);
  }
}
</script>

<style>
.preview-item-layout {
  width: 100%;
  text-align: center;
  background-color: #eee;
  border: 1px solid #aaa;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
}
.preview-item-layout label {
  padding: 20px;
  text-align: center;
  width: 100%;
  color: #aaa;
}
</style>