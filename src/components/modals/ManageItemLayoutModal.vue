<template>
  <b-modal
      ref="modal"
      centered
      ok-variant="primary"
      cancel-variant="outline-secondary"
      no-close-on-backdrop
      no-close-on-esc
      @shown="onShown"
      @ok="onOk"
      @cancel="renderProp = null">
    <span slot="modal-title" v-t="'modal.itemLayout.title'" />
    <span slot="modal-ok" v-t="'button.applyAndClose'" />
    <span slot="modal-cancel" v-t="'button.cancel'" />
    <div ref="renderRoot" class="preview-item-layout">
      <label
          v-if="renderProp === null"
          v-t="'modal.itemLayout.noPreview'" />
      <label v-else-if="typeof renderProp === 'string'" v-html="renderProp" /><!-- Dont know why v-text does not work -->
      <RenderNode v-else :render-prop="renderProp" />
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
import Lodash from 'lodash';
import { Component, Vue } from 'vue-property-decorator';

import { getPropDefaultValue, isVisibleComponent } from '../../lib/appinventor-sources/SimpleComponents';
import { AiaScmFile, EmptyAiaScmFile, LvgItemLayout, LvgPlainItemLayout } from '../../typings/lvg';
import FileUtils from '../../utils/FileUtils';
import RenderNode from './itemLayoutRender/RenderNode.vue';

interface SemiRenderProp {
  Width?: number;
  Height?: number;
  name: string;
  type: string;
  alignVertical: 'top' | 'center' | 'bottom';
  alignHorizontal: 'left' | 'center' | 'right';
  orientation: 'Width' | 'Height';
  scroll: boolean;
  children: Array<SemiRenderProp | undefined>;
}
export interface RenderProp extends SemiRenderProp {
  Width: number;
  Height: number;
  children: RenderProp[];
}

@Component({ components: { RenderNode } })
export default class ManageItemLayoutModal extends Vue {
  public $refs!: {
    modal: BModal;
    renderRoot: HTMLElement;
  };

  private itemLayoutFile: File | null = null;
  private fileSelected: File | null = null;
  private renderProp: RenderProp | string | null = null;

  private get device () {
    const templateDeviceWidth = 1080;
    const templateDeviceHeight = 1920;
    const Width = this.$refs.renderRoot.clientWidth;
    return {
      Width,
      Height: templateDeviceHeight * Width / templateDeviceWidth,
    };
  }

  public showModal (itemLayoutFile: File) {
    this.$refs.modal.show();
    this.itemLayoutFile = itemLayoutFile;
  }

  private async renderProperties () {
    this.renderProp = null;
    if (this.itemLayoutFile === null || this.itemLayoutFile.size === 0) {
      return;
    }
    this.renderProp = this.itemLayoutFile.name;
    const zip = await FileUtils.readZip(this.itemLayoutFile);
    const res = zip.folder('src').filter(relativePath => relativePath.endsWith('Screen1.scm'));
    if (res.length === 0) {
      // TODO:
      console.log('No Screen1.scm in itemLayout aia');
      return;
    }
    const fileContent = await res[0].async('text');
    const scmMatch = /\{.*\}/.exec(fileContent);
    if (scmMatch === null || scmMatch.length !== 1) {
      // TODO:
      console.log('Screen1.scm format cannot be recognized');
      return;
    }
    const formProperties = (JSON.parse(scmMatch[0]) as AiaScmFile).Properties;
    formProperties.Width = '-2';  // as another form 'fill-parent'
    formProperties.Height = '-1'; // make it auto
    function makeChildrenAuto (lengthType: 'Width' | 'Height', itemLayout: LvgItemLayout) {
      if (itemLayout.$Components) {
        itemLayout.$Components.forEach(child => {
          // any 'fill-parent' child of 'auto' parent would be consider as 'auto'
          if (child[lengthType] === '-2') {
            child[lengthType] = '-1';
          }
        });
      }
    }
    makeChildrenAuto('Height', formProperties);

    const LENGTH_AUTO = {
      Width: 100,
      Height: 30,
    };
    const parseSemiRenderProps = (
        lengthType: 'Width' | 'Height', itemLayout: LvgItemLayout, parentOrientation: 'Width' | 'Height',
        parentLength: number | null, lengthFillParent: number,
    ): SemiRenderProp => {
      if (!itemLayout.$Components) {
        itemLayout.$Components = [];
      }
      const length = Number(itemLayout[lengthType]);
      const orientation = [ 'HorizontalArrangement', 'HorizontalScrollArrangement' ].includes(itemLayout.$Type)
          ? 'Width' : 'Height';
      const parseLength = () => {
        if (!itemLayout.$Components) {
          itemLayout.$Components = [];
        }
        ////////// fill-parent ///////////
        if (length === -2) {
          if (parentLength === null) {
            return this.device[lengthType];
          } else {
            // dont't need to worry about parent being auto, see call of `makeChildrenAuto()` below
            if (parentOrientation === lengthType) {
              return lengthFillParent;
            } else {
              return parentLength;
            }
          }
        ////////// const length //////////
        } else if (length >= 0) {
          return length;
        ////////// percent //////////
        } else if (length < -1000 && length >= -1100) { // percent
          const percent = (-1000 - length) / 100;
          return this.device[lengthType] * percent;
        ////////// treat all rest values as 'auto' (including '-1' itself) //////////
        } else {
          if (itemLayout.$Components.length === 0) {
            return LENGTH_AUTO[lengthType];
          } else {
            makeChildrenAuto(lengthType, itemLayout);
            const childrenMeasurement = itemLayout.$Components.map(child =>
                parseSemiRenderProps(lengthType, child, orientation,
                    null, 0 /* does not matter since they are only used in 'fill-parent' */ )[lengthType]);
            if (orientation === lengthType) {
              return Lodash.sum(childrenMeasurement);
            } else {
              return Lodash.max(childrenMeasurement) as number;
            }
          }
        }
      }; // End of parseLength
      const thisLength = parseLength();
      const childrenResult: Array<SemiRenderProp | undefined> = [];
      let numChildFillParent = 0;
      let lengthUsedByChild = 0;
      itemLayout.$Components.forEach((child, index) => {
        if (child[lengthType] === '-2') {
          numChildFillParent ++;
        } else {
          const childMeasure: SemiRenderProp = parseSemiRenderProps(lengthType, child, orientation,
              null, 0); // does not matter since they are only used in 'fill-parent'
          childrenResult[index] = childMeasure;
          lengthUsedByChild += childMeasure[lengthType] as number;
        }
      });
      let childLengthFillParent: number;
      if (lengthUsedByChild > thisLength) {
        childLengthFillParent = LENGTH_AUTO[lengthType];
      } else {
        if (orientation === lengthType) {
          childLengthFillParent = (thisLength - lengthUsedByChild) / numChildFillParent;
        } else {
          childLengthFillParent = thisLength;
        }
      }
      itemLayout.$Components.forEach((child, index) => {
        if (child[lengthType] === '-2') {
          childrenResult[index] = parseSemiRenderProps(lengthType, child, orientation,
              thisLength, childLengthFillParent);
        }
      });
      const result: SemiRenderProp = {
        name: itemLayout.$Name,
        type: itemLayout.$Type,
        alignHorizontal: (() => {
          const alignH = itemLayout.AlignHorizontal || getPropDefaultValue(itemLayout.$Type, 'AlignHorizontal');
          switch (alignH) {
            case '1': return 'left';
            case '3': return 'center';
            case '2': return 'right';
            default:  return 'left';
          }
        })(),
        alignVertical: (() => {
          const alignV = itemLayout.AlignVertical || getPropDefaultValue(itemLayout.$Type, 'AlignVertical');
          switch (alignV) {
            case '1': return 'top';
            case '2': return 'center';
            case '3': return 'bottom';
            default:  return 'top';
          }
        })(),
        orientation,
        scroll: [ 'VerticalScrollArrangement', 'HorizontalScrollArrangement' ].includes(itemLayout.$Type),
        children: childrenResult,
      };
      result[lengthType] = thisLength;
      return result;
    };
    const renderProp = Lodash.merge(
      parseSemiRenderProps('Width', formProperties, 'Height', this.device.Width, this.device.Width),
      parseSemiRenderProps('Height', formProperties, 'Height', this.device.Height, this.device.Height),
    ) as RenderProp;
    this.renderProp = renderProp;
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