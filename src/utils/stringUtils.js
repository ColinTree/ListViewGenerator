export default {
  removeSuffix(str, suffix) {
    return str.lastIndexOf(suffix) == str.length - suffix.length
        ? str.substr(0, str.length - suffix.length)
        : str;
  },
  replaceAll(str, search, replace) {
    return typeof(str) == "string"
        ? str.split(search).join(replace)
        : str;
  },
  replaceAllLoop(str, search, replace) {
    if (search.length < replace.length && replace.lastIndexOf(search) == replace.length - search.length) {
      throw "Internal error: replace via loop will cause dead loop.";
    }
    let tmp;
    if (search.length == replace.length) {
      do {
        tmp = str;
        str = str.replace(search, replace);
      } while (tmp != str);
    } else {
      do {
        tmp = str.length;
        str = str.replace(search, replace);
      } while (tmp != str.length);
    }
    return str;
  },
  /**
   * @param {string} text 
   * @param {object} obj require a object like {"oldText": "newText"}
   */
  replaceAllInObj(str, obj) {
    for (let oldText in obj) {
      str = this.replaceAll(str, oldText, obj[oldText]);
    }
    return str;
  }
}