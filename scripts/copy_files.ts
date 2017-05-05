
import * as path from "path";
import * as fs from "fs-extra";
import * as Q from "q";
import * as common from "./common";

// determine the output dir
let output = path.join(__dirname, "..", "build");
console.log("Output Dir: " + output);

// retrieve all the task directories
let tasks = common.get_tasks();

// create and array of the files in the task directory that need to be copied
let task_files_to_copy = ["task.json", "icon.png"];

// perform the operation to copy task files
let task_files = tasks.map(function (task_name) {

  // iterate around the files to copy
  task_files_to_copy.forEach(function (filename) {

    // copy the task file into the build location
    let source = path.join(__dirname, "..", "tasks", task_name, filename);
    let destination = path.join(output, "tasks", task_name);

    console.log("Copying: %s", source);

    common.copyFileSync(source, destination);
  });
});

// determine the files that need to be copied
let items = [
  path.join(__dirname, "..", "vss-extension.json"),
  path.join(__dirname, "..", "overview.md"),
  path.join(__dirname, "..", "license.txt"),
  path.join(__dirname, "..", "screenshot_env_task.png"),
  path.join(__dirname, "..", "screenshot_env_parameters.png"),
  path.join(__dirname, "..", "screenshot_chef_server_endpoint.png"),
  path.join(__dirname, "..", "images")
]

let extension_files = items.map(function (item) {

  console.log("Copying: " + item)

  // check the type of item and use the appropriate function
  // file
  if (fs.statSync(item).isFile()) {
    common.copyFileSync(item, output)
  }

  // directory
  if (fs.statSync(item).isDirectory()) {
    common.copyFolderRecursiveSync(item, output)
  }
})


Q.all([task_files, extension_files])
  .fail(function (err) {
    console.error(err)
    process.exit(1)
  })
