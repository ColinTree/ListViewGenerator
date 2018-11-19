import fetchival from "fetchival"

export default {
  get(url) {
    return fetchival(url).get();
  },
  getPlainText(url) {
    return fetchival(url, { responseAs: "text" }).get();
  },
  post(url, data) {
    return fetchival(url).post(data);
  }
};