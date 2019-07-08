<template>
  <div id="app">
    <div id="header">
      <i18n tag="label" path="header.language-switch">
        <b-link
            v-t="'header.language-switch-to'"
            @click="$i18n.locale = $t('header.language-switch-to').toLowerCase()" />
      </i18n>
      <i18n tag="h2" path="header.primary-title">
        <i18n tag="label" path="header.secondary-title">
          <a target="_blank"
              style="color:red; text-decoration:underline"
              :href="GITHUB_REPO_RELEASE_LATEST_URL"
              v-show="versionCode"
              v-t="{ path: 'header.update-info', args: { versionCode } }" />
        </i18n>
      </i18n>
    </div>
    <!--[if IE]>
      <div class="alert alert-danger" role="alert">Please use browsers other than Internet Explorer :)</div>
    <![endif]-->

    <Content/>

    <div id="footer">
      <b-link v-b-modal="'aboutModal'" v-t="'footer.about'" />
      <b-link :href="`${GITHUB_REPO_FULL_URL}issues`" target="_blank" v-t="'footer.gotIssue'" />

      <b-modal id="aboutModal" centered ok-only>
        <span slot="model-title" v-t="'footer.aboutModal.title'" />
        <span slot="model-ok" v-t="'button.ok'" />
        <div v-for="(info, ind) in infos" :key="ind">
          <label v-t="info.title" />: <b-link :href="info.link" target="_blank" v-t="info.linkText" />
        </div>
      </b-modal>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import semver from 'semver';

import pkg from '../package.json';

import Content from './components/Content.vue';

import AjaxUtils from './utils/AjaxUtils';
import { GITHUB_REPO_FULL_API_URL, GITHUB_REPO_FULL_URL,
  GITHUB_AUTHOR_FULL_URL, GITHUB_REPO_RELEASE_LATEST_URL } from './const';

@Component({
  components: { Content },
})
export default class App extends Vue {
  private readonly GITHUB_REPO_RELEASE_LATEST_URL = GITHUB_REPO_RELEASE_LATEST_URL;
  private readonly GITHUB_REPO_FULL_URL = GITHUB_REPO_FULL_URL;
  private readonly infos = [
    {
      title: 'common.author',
      link: GITHUB_AUTHOR_FULL_URL,
      linkText: 'common.ColinTree',
    },
    {
      title: 'common.contributors',
      link: `${GITHUB_REPO_FULL_URL}graphs/contributors`,
      linkText: 'common.showOnGithub',
    },
    {
      title: 'common.repo',
      link: GITHUB_REPO_FULL_URL,
      linkText: 'common.showOnGithub',
    },
    {
      title: 'common.projectMadeWith',
      link: 'https://vuejs.org',
      linkText: 'Vue.js',
    },
  ];
  private versionCode = null;
  private locale = 'en';

  @Watch('locale')
  private onlocaleChanged (val: string, oldVal: string) {
    this.$i18n.locale = val;
  }

  private async created () {
    // the returning text may not be shown to user
    // the behavior depends on the browser
    window.onbeforeunload = () => this.$t('onUnload');

    console.log(`language=${navigator.language}`);
    this.locale = navigator.language.substring(0, 2);

    try {
      const { tag_name } = (await AjaxUtils.get(`${GITHUB_REPO_FULL_API_URL}releases/latest`)).data;
      if (!(semver.valid(tag_name) && semver.valid(pkg.version))) {
        console.error('Failed checking version');
      }
      if (semver.gt(tag_name, pkg.version)) {
        this.versionCode = tag_name;
      }
    } catch (e) {
      // 404 will be returned if latest release is called and there is no release
      // catch it here and just ignore it
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

#header {
  margin-bottom: 20px;
}
#header label {
  /*float: right*/
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

#footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
}
@media (min-width: 751px) {
  #footer {
    padding-left: 20px;
    padding-right: 20px;
  }
}
.btn-default {
  background-color: buttonface;
}
</style>
