import Vue from 'vue'

import '@babel/polyfill'
import 'mutationobserver-shim'
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import './plugins-no-type.js'
import App from './App.vue'
import i18n from './i18n'

Vue.use(BootstrapVue)

Vue.config.productionTip = false

new Vue({
  i18n,
  render: h => h(App),
}).$mount('#app')
