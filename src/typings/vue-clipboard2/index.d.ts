import Vue from 'vue';

interface VueClipboardConfig {
  autoSetContainer: boolean;
  appendToBody: boolean;
}

declare module 'vue/types/vue' {
  interface Vue {
    $clipboardConfig: VueClipboardConfig;
    $copyText (text: string, container: Vue | any): void;
  }
}
