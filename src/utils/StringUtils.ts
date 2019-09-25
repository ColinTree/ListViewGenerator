import { nameValid } from 'json-to-java/bin/notations/BaseWithName';

export default class StringUtils {
  public static removeSuffix (str: string, suffix: string) {
    return str.lastIndexOf(suffix) === str.length - suffix.length
      ? str.substr(0, str.length - suffix.length)
      : str;
  }
  public static ensureComponentNameValid (name: string) {
    if (nameValid(name) || name.length === 0) {
      return name;
    }
    return 'Unicode_' + name.split('').map((c, index) => name.charCodeAt(index).toString(16)).join('');
  }
}
