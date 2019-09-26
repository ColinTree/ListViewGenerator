import { nameValid } from 'json-to-java/bin/notations/BaseWithName';

export default class StringUtils {
  public static removeSuffix (str: string, suffix: string) {
    return str.endsWith(suffix) ? str.substr(0, str.length - suffix.length) : str;
  }
  public static ensureComponentNameValid (name: string) {
    if (nameValid(name) || name.length === 0) {
      return name;
    }
    return 'Unicode_' + name.split('').map(c => c.charCodeAt(0).toString(16)).join('_');
  }
}
