<template>
  <div id="header">
    <label v-if="$i18n.locale == 'en'">En | <b-link @click="$i18n.locale = 'zh'">Zh</b-link></label>
    <label v-else><b-link @click="$i18n.locale = 'en'">En</b-link> | Zh</label>
    <h2>{{ $t("header.primary-title") }}
      <label>{{ $t("header.secondary-title") }} 
        <a target="_blank"
            style="color:red; text-decoration:underline"
            :href="link"
            v-show="versionCode!=''">{{ $t("header.update-info") + versionCode }}</a>
      </label>
    </h2>
  </div>
  <!--[if IE]>
    <div class="alert alert-danger" role="alert">Please use browsers other than Internet Explorer :)</div>
  <![endif]-->
</template>

<script>
import pkg from "../../package.json"

import ajaxUtils from "../utils/ajaxUtils.js"

export default {
  name: "Header",
  data() {
    return {
      apiUrl: "https://api.github.com/repos/ColinTree/ListViewGenerator/releases/latest",
      link: "https://github.com/ColinTree/ListViewGenerator/releases",
      versionCode: ""
    }
  },
  created() {
    ajaxUtils.get(this.apiUrl)
    .then(data => {
      try {
        if (!this.isCurrentLatest(data.tag_name)) {
          this.link = data.html_url;
          this.versionCode = data.tag_name;
        }
      } catch (err) {
        console.error(err);
      }
    })
    .catch(() => {
      // 404 will be returned if latest release is called and there is no release
      // catch it here and just ignore it
    });
  },
  methods: {
    isCurrentLatest(latestTag) {
      let curr = pkg.version.split(".");
      latestTag = latestTag.split(".");
      if (curr.length != 3 || latestTag.length != 3) {
        throw "Error format of current / latest version code, should be x.x.x"
      }
      if (latestTag[0] > curr[0]) return false;
      if (latestTag[0] < curr[0]) return true;
      // latestTag[0] == curr[0]
      if (latestTag[1] > curr[1]) return false;
      if (latestTag[1] < curr[1]) return true;
      // latestTag[1] == curr[1]
      return latestTag[2] <= curr[2];
    }
  }
}
</script>

<style>
#header {
  margin-bottom: 20px;
}
#header label {
  /*float: right;*/
  font-size: small;
  font-weight: initial;
  color: gray;
}
@media (min-width: 751px) {
  #header > hr {
    display: none;
  }
  #header {
    padding-left: 20px;
    padding-right: 20px;
  }
}
#header>label {
  float: right;
}
</style>
