import Vue from "vue"


import Alertify from "vue-alertify"
import "alertifyjs/build/css/themes/bootstrap.css"
import Bootstrap from "bootstrap-vue"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-vue/dist/bootstrap-vue.css"
import Clipboard from "vue-clipboard2"
import HighlightJS from "vue-highlight.js"
import "highlight.js/styles/default.css";
import ShortKey from "vue-shortkey"

import App from "./App"
import i18n from "./i18n"

Vue.config.productionTip = false;

Vue.use(Alertify);
Vue.use(Bootstrap);
Vue.use(Clipboard);
Vue.use(HighlightJS);
Vue.use(ShortKey);

new Vue({
  i18n,
  render: h => h(App)
}).$mount("#app")
