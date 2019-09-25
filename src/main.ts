import Vue from 'vue';

import '@babel/polyfill';
import BootstrapVue from 'bootstrap-vue';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'highlight.js/styles/default.css';
import 'mutationobserver-shim';
import Clipboard from 'vue-clipboard2';
import HighlightJS from 'vue-highlight.js';
import 'vue-highlight.js/lib/allLanguages';

import App from './App.vue';
import i18n from './i18n';
import './plugins-no-type.js';

Vue.use(BootstrapVue);
Vue.use(Clipboard);
Vue.use(HighlightJS);

Vue.config.productionTip = false;

new Vue({
  i18n,
  render: h => h(App),
}).$mount('#app');
