import Vue from 'vue'

import Alertify from 'vue-alertify'
import Clipboard from 'vue-clipboard2'
import ShortKey from 'vue-shortkey'
import HighlightJS from 'vue-highlight.js'
import 'highlight.js/styles/default.css'
import javascript from 'highlight.js/lib/languages/java.js'

Vue.use(Alertify)
Vue.use(Clipboard)
Vue.use(ShortKey)
Vue.use(HighlightJS, { languages: { javascript } })