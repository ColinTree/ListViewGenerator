import axios from 'axios'

export default class AjaxUtils {
  public static async get (url: string) {
    return (await axios.get(url)).data
  }
}
