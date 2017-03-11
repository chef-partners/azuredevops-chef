
import * as path from "path";
import * as fs from "fs-extra";
import * as Q from "q";

// Iterate around the tasks
function get_tasks() {
  let task_dir = path.join(__dirname, "../tasks");
  return fs.readdirSync(path.join(__dirname, '../tasks')).filter(function (file) {
    return ['common', 'typings'].indexOf(file.toLowerCase()) < 0
      && fs.statSync(path.join(task_dir, file)).isDirectory();
  })
}

function copyFileSync( source, target ) {

    let targetFile = target;

    // if target is a directory a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target ) {
    let files = [];

    //check if folder needs to be created or integrated
    let targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    //copy
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

// determine the output dir
let output = path.join(__dirname, '..', 'build')
console.log("Output Dir: " + output)

// retrieve all the task directories
let tasks = get_tasks()

// perform the operation to copy task files
let task_files = tasks.map(function (task_name) {

  // copy the task file into the build location
  var source = path.join(__dirname, '..', 'tasks', task_name, 'task.json')
  var destination = path.join(output, 'tasks', task_name)

  console.log('Copying: ' + source)

  copyFileSync(source, destination)
})

// determine the files that need to be copied
var items = [
  path.join(__dirname, '..', 'vss-extension.json'),
  path.join(__dirname, '..', 'overview.md'),
  path.join(__dirname, '..', 'license.txt'),
  path.join(__dirname, '..', 'screenshot_env_task.png'),
  path.join(__dirname, '..', 'screenshot_env_parameters.png'),
  path.join(__dirname, '..', 'images')
]

var extension_files = items.map(function (item) {

  console.log('Copying: ' + item)

  // check the type of item and use the appropriate function
  // file
  if (fs.statSync(item).isFile()) {
    copyFileSync(item, output)
  }

  // directory
  if (fs.statSync(item).isDirectory()) {
    copyFolderRecursiveSync(item, output)
  }
})


Q.all([task_files, extension_files])
  .fail(function (err) {
    console.error(err)
    process.exit(1)
  })
