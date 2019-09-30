<template>
  <div ref="thisNodeContainer" :style="thisNodeStyle" class="render-node">
    <span v-if="renderProp.children.length === 0" v-text="renderProp.name" style="" />
    <div v-else :style="childrenContainerStyle" class="children-container">
      <RenderNode v-for="child in (renderProp.children || [])" :key="child.name" :render-prop="child" />
    </div>
  </div>
</template>

<script lang="ts">
import Lodash, { Dictionary } from 'lodash';
import randomColor from 'randomcolor';
import { PropOptions } from 'vue';
import { Component, Prop, Vue } from 'vue-property-decorator';

import { getPropDefaultValue } from '../../../lib/appinventor-sources/SimpleComponents';
import { LvgItemLayout } from '../../../typings/lvg';
import { RenderProp } from '../ManageItemLayoutModal.vue';

type Length = 'fill-parent' | 'auto' | number | { percent: number };
interface MeasureResult {
  compType: string;
  width: number | 'fill-parent';
  height: number | 'fill-parent';
}

@Component({ components: { RenderNode } })
export default class RenderNode extends Vue {

  @Prop({ type: Object, required: true })
  public readonly renderProp!: RenderProp;

  public get thisNodeStyle () {
    function textColor (c: string) {
      const color = Number(c.substr(1, 6));
      const r = 0xff - (Math.floor(color / 0x10000) % 0x100);
      const g = 0xff - (Math.floor(color / 0x100) % 0x100);
      const b = 0xff - (color % 0x100);
      const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
      return hsp > 127.5 ? '#fff' : '#000';
    }
    const bgColor = randomColor();
    return {
      'padding': '0px',
      'margin': '0px',
      'border-width': '0px',
      'min-width': `${this.renderProp.Width}px`,
      'height': `${this.renderProp.Height}px`,
      'background-color': bgColor,
      'color': textColor(bgColor),
    };
  }
  get childrenContainerStyle () {
    // Thanks to https://css-tricks.com/snippets/css/a-guide-to-flexbox/
    return {
      'width': `${this.renderProp.Width}px`,
      'height': `${this.renderProp.Height}px`,
      'flex-direction': this.renderProp.orientation === 'Height' ? 'column' : 'row',
      'justify-content': this.renderProp.alignHorizontal === 'left'
          ? 'flex-start'
          : this.renderProp.alignHorizontal === 'center' ? 'center' : 'flex-end',
      'align-content': this.renderProp.alignVertical === 'top'
          ? 'flex-start'
          : this.renderProp.alignVertical === 'center' ? 'center' : 'flex-end',
      'align-items': this.renderProp.alignVertical === 'top'
          ? 'flex-start'
          : this.renderProp.alignVertical === 'center' ? 'center' : 'flex-end',
      'overflow': this.renderProp.scroll
          ? this.renderProp.orientation === 'Width' ? 'scroll hidden' : 'hidden scroll'
          : 'hidden',
    };
  }

}
</script>

<style>
.render-node {
  border: black dashed;
  box-sizing: content-box;
  font-size: 10px;
  line-height: 20px;
}
.children-container {
  display: flex;
  flex-wrap: nowrap;
}
.children-container::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.children-container::-webkit-scrollbar-track {
  background: #f1f1f1; 
}
.children-container::-webkit-scrollbar-thumb {
  background: #888; 
}
.children-container::-webkit-scrollbar-thumb:hover {
  background: #555; 
}
</style>
