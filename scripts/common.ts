
/*

Common functions an libraries that any of the scripts can use

*/

import * as path from "path";
import * as fs from "fs-extra";
import * as Q from "q";

// Iterate around the tasks
export function get_tasks(task_dir = null) {
  if (task_dir == null) {
    task_dir = path.join(__dirname, "..", "tasks");
  }
  return fs.readdirSync(task_dir).filter(function (file) {
    return ["common", "typings"].indexOf(file.toLowerCase()) < 0
      && fs.statSync(path.join(task_dir, file)).isDirectory();
  });
}

export function copyFileSync( source, target ) {

    let targetFile = target;

    // if target is a directory a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

export function copyFolderRecursiveSync( source, target ) {
    let files = [];

    // check if folder needs to be created or integrated
    let targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    // copy
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            let curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}