import FileSaver from 'file-saver';
import JSZip from 'jszip';
import Lodash from 'lodash';

export interface ZipObject {
  __isDir__: boolean;
  [fileOrDirName: string]: ZipObject | string | number | boolean | Blob;
}

export default class FileUtils {
  public static readZip (zipFile: File) {
    return JSZip.loadAsync(zipFile);
  }
  public static sampleZipObject (): ZipObject {
    const debug = {hello: 'world'};
    const blob = new Blob(
      [JSON.stringify(debug, null, 2)],
      {type : 'application/json'});
    return {
      '__isDir__': true,
      'dir1': {
        __isDir__: true,
        fileInDir1: 'content',
        fileInDir2: 'content',
      },
      'file1.txt': 'content',
      'file2.json.blob': blob,
    };
  }
  public static emptyDirZipObject (): ZipObject {
    return { __isDir__: true };
  }
  public static toZip (zipObject: ZipObject) {
    function zipADir (zip: JSZip, zipObj: ZipObject) {
      Lodash.forOwn(zipObj, (content, fileName) => {
        if (fileName === '__isDir__') {
          return;
        }
        if (typeof content === 'object' && !(content instanceof Blob) && content.__isDir__ === true) {
          zipADir(zip.folder(fileName), content);
          return;
        } else {
          zip.file(fileName, content.toString());
        }
      });
      return zip;
    }
    return zipADir(new JSZip(), zipObject).generateAsync({type: 'blob'});
  }
  public static downloadFile (content: string | Blob, name: string) {
    FileSaver.saveAs(content, name);
  }
}
