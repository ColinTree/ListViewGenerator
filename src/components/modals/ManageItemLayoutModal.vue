<template>
  <b-modal
      :title="$t('modal.itemLayout.title')"
      centered
      :ok-title="$t('button.applyAndClose')"
      :cancel-title="$t('button.cancel')"
      ok-variant="primary"
      cancel-variant="outline-secondary"
      no-close-on-backdrop
      no-close-on-esc
      @shown="onShown"
      @ok="onOk"
      @cancel="renderProps = null">
    <div
        class="preview-item-layout"
        ref="renderRoot">
      <label
          v-if="renderProps == null"
          v-t="'modal.itemLayout.noPreview'" />
      <label v-else>{{ renderProps }}</label><!-- Dont know why v-text does not work -->
    </div>
    <b-input-group>
      <b-form-file
          v-model="itemLayoutFileInput"
          accept=".aia"
          :placeholder="$t('content.upload.chooseFileHint')"
          :lang="$i18n.locale" />
      <b-input-group-append v-if="Boolean(itemLayoutFileInput)">
        <b-btn
            variant="primary"
            v-t="'modal.itemLayout.previewButtonText'"
            @click="onApply" />
      </b-input-group-append>
    </b-input-group>
  </b-modal>
</template>

<script>
import fileUtils from '../../utils/fileUtils';

export default {
  name: "ManageItemLayoutModal",
  data() {
    return {
      itemLayoutFile: null,
      itemLayoutFileInput: null,
      renderProps: null
    }
  },
  methods: {
    showModal(itemLayoutFile) {
      this.itemLayoutFile = itemLayoutFile;
      this.$children[0].show();
    },

    onShown() {
      this.render();
    },
    onApply() {
      this.itemLayoutFile = this.itemLayoutFileInput;
      this.render();
    },
    onOk() {
      this.$emit("ok", this.itemLayoutFile);
    },

    render() {
      this.renderProps = null;
      if (this.itemLayoutFile == null) return;
      // Read file
      this.renderProps = this.itemLayoutFile.name;
    }
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