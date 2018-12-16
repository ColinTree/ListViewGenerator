<template>
  <div id="footer">
    <b-link v-b-modal="'aboutModal'" v-t="'footer.about'" />
    <label><a :href="repoUrl+'/issues'" target="_blank" v-t="'footer.gotIssue'" /></label>
    <b-modal
        id="aboutModal"
        centered
        :title="$t('footer.aboutModal.title')"
        :ok-title="$t('button.ok')" ok-only>
      <span v-for="(info, ind) in infos" :key="ind">
        <label>{{ $t(info.title) }}</label>
        <label v-if="info.linkText && info.link">: <b-link :href="info.link" target="_blank">{{ $t(info.linkText) }}</b-link></label>
        <br/>
      </span>
    </b-modal>
  </div>
</template>

<script>
export default {
  name: "Footer",
  data() {
    return {
      repoUrl: "https://github.com/ColinTree/ListViewGenerator",
      infos: []
    }
  },
  created() {
    this.infos = [
      {
        title: "common.author",
        link: "https://github.com/ColinTree",
        linkText: "common.ColinTree"
      },
      {
        title: "common.contributors",
        link: this.repoUrl + "/graphs/contributors",
        linkText: "common.showOnGithub"
      },
      {
        title: "common.repo",
        link: this.repoUrl,
        linkText: "common.showOnGithub"
      },
      {
        title: "common.projectMadeWith",
        link: "https://vuejs.org",
        linkText: "Vue.js"
      }
    ]
  }
}
</script>

<style>
#footer {
  margin-top: 10px;
}
#footer>label {
  float: right;
}
@media (min-width: 751px) {
  #footer {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>