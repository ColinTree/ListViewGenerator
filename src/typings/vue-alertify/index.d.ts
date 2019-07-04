import Vue from 'vue'

declare interface AlertifyNotification {
  //
}

declare module 'vue/types/vue' {
  interface Vue {
    readonly $alertify: {
      success(text: string | any): AlertifyNotification
      error(text: string | any): AlertifyNotification
      warning(text: string | any): AlertifyNotification
      message(text: string | any): AlertifyNotification

      alert(text: string | any, cb: Function): AlertifyNotification
      alertWithTitle(title: string, text: string | any, cb: Function): AlertifyNotification

      confirm(text: string | any, ok: Function, cancel: Function): AlertifyNotification
      confirmWithTitle(title: string, text: string | any, ok: Function, cancel: Function): AlertifyNotification

      prompt(text: string | any, defaultValue: string, ok: Function, cancel: Function): AlertifyNotification
      promptWithTitle(title: string, text: string | any, defaultValue: string, ok: Function, cancel: Function): AlertifyNotification
    }
  }
}