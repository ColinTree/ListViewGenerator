import Vue from 'vue';

declare interface AlertifyNotification {
  [key: string]: any;
}

declare module 'vue/types/vue' {
  interface Vue {
    readonly $alertify: {
      success (text: string | any): AlertifyNotification
      error (text: string | any): AlertifyNotification
      warning (text: string | any): AlertifyNotification
      message (text: string | any): AlertifyNotification

      alert (text: string | any, cb: () => void): AlertifyNotification
      alertWithTitle (
        title: string,
        text: string | any,
        cb: () => void): AlertifyNotification

      confirm (text: string | any, ok: () => void, cancel: () => void): AlertifyNotification
      confirmWithTitle (
        title: string,
        text: string | any,
        ok: () => void,
        cancel: () => void): AlertifyNotification

      prompt (text: string | any, defaultValue: string, ok: () => void, cancel: () => void): AlertifyNotification
      promptWithTitle (
        title: string,
        text: string | any,
        defaultValue: string,
        ok: () => void,
        cancel: () => void): AlertifyNotification,
    };
  }
}
