import { nameValid } from 'json-to-java/bin/notations/BaseWithName';

export default class StringUtils {
  public static removeSuffix (str: string, suffix: string) {
    return str.lastIndexOf(suffix) === str.length - suffix.length
      ? str.substr(0, str.length - suffix.length)
      : str;
  }
  public static replaceAll (str: string, search: string, replace: string) {
    return typeof str === 'string'
      ? str.split(search).join(replace)
      : str;
  }
  public static replaceAllLoop (str: string, search: string, replace: string) {
    if (search.length < replace.length && replace.lastIndexOf(search) === replace.length - search.length) {
      throw new Error('Internal error: replace via loop will cause dead loop.');
    }
    let tmp;
    if (search.length === replace.length) {
      do {
        tmp = str;
        str = str.replace(search, replace);
      } while (tmp !== str);
    } else {
      do {
        tmp = str.length;
        str = str.replace(search, replace);
      } while (tmp !== str.length);
    }
    return str;
  }
  public static replaceAllInObj (str: string, obj: { [key: string]: string }) {
    Object.keys(obj).map(oldText => {
      str = this.replaceAll(str, oldText, obj[oldText]);
    });
    return str;
  }
  /**
   * the order splitters shown up in `str` is strictly checked,
   * and all spliters should appear only once
   *
   * @param str string to be splited
   * @param splitters splitters
   * @returns an array with length of (splitters.length + 1)
   * @throws Error when any splitter appears more than once OR splitters are not appearing in order
   */
  public static strictSplit (str: string, splitters: string | string[]) {
    if (!Array.isArray(splitters)) {
      splitters = [ splitters ];
    }
    const result: string[] = [];
    splitters.map(splitter => {
      const tmp = str.split(splitter);
      if (tmp.length < 2) {
        throw new Error(`no such splitter: ${splitter}`);
      }
      if (tmp.length > 2) {
        throw new Error(`more than one splitter is found: ${splitter}`);
      }
      result.push(tmp[0]);
      str = tmp[1];
    });
    result.push(str);
    return result;
  }
  public static ensureComponentNameValid (name: string) {
    if (nameValid(name) || name.length === 0) {
      return name;
    }
    return 'Unicode_' + name.split('').map((c, index) => name.charCodeAt(index).toString(16)).join('');
  }
}
