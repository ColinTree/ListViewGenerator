<template>
  <div id="app">
    <Header/>
    <Content/>
    <Footer/>
  </div>
</template>

<script>
import Header from "./components/Header"
import Content from "./components/Content"
import Footer from "./components/Footer"

export default {
  name: "app",
  components: {
    Header,
    Content,
    Footer
  },
  data() {
    return {
      locale: "en"
    }
  },
  created() {
      // the returning text may not be shown to user
      // the behavior depends on the browser
    window.onbeforeunload = () => this.$t("onUnload");
  },
  mounted() {
    var userLang = navigator.language || navigator.userLanguage;
    // eslint-disable-next-line
    console.log("language=" + userLang);
    this.locale = userLang.substring(0, 2);
  },
  watch: {
    locale(val) {
      this.$i18n.locale = val; 
    }
  }
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
}
#app {
  margin-top: 30px;
  margin-left: 10px;
  margin-right: 10px;
}
@media (min-width: 751px) {
  #app {
    width: 730px;
    margin-left: auto;
    margin-right: auto;
  }
}

.btn-default {
  background-color: buttonface;
}
</style>
