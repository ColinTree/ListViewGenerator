import axios from "axios"

export default {
  async get(url) {
    return (await axios.get(url)).data;
  }
};