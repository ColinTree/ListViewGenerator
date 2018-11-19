import JSZip from "jszip"
import FileSaver from "file-saver"

export default {
  readZip(zipFile) {
    return new Promise((resolve, reject) => {
      JSZip.loadAsync(zipFile)
      .then((zip) => {
        resolve(zip);
      });
    });
  },
  sampleZipObject() {
    var debug = {hello: "world"};
    var blob = new Blob(
      [JSON.stringify(debug, null, 2)],
      {type : 'application/json'});
    return {
      "dir1": {
        __isDir: true,
        "fileInDir1": "content",
        "fileInDir2": "content"
      },
      "file1.txt": "content",
      "file2.json.blob": blob
    };
  },
  emptyDirZipObject() {
    return { __isDir: true };
  },
  toZip(zipObject) {
    function zipADir(zip, zipObject){
      for (let fileName in zipObject) {
        let content = zipObject[fileName];
        if (fileName == "__isDir") continue;
        if (content.constructor === Object && content.__isDir === true) {
          zipADir(zip.folder(fileName), content);
          continue;
        }
        zip.file(fileName, content);
      }
      return zip;
    }
    return new Promise((resolve, reject) => {
      zipADir(new JSZip(), zipObject)
      .generateAsync({type:"blob"})
      .then(content => resolve(content))
    });
  },
  downloadFile(content, name) {
    FileSaver.saveAs(content, name);
  }
}