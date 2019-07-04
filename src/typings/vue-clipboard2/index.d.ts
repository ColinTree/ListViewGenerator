import Vue from 'vue'

interface VueClipboardConfig {
  autoSetContainer: boolean
  appendToBody: boolean
}

declare module 'vue/types/vue' {
  interface Vue {
    $copyText (text: string, container: Vue | any): void
    $clipboardConfig: VueClipboardConfig
  }
}
