
import * as common from "./common";
import * as path from "path";
import * as Q from "q";

// retrieve all the task directories
let tasks = common.get_tasks();

// determine the path to the common dir
let common_dir = path.join(__dirname, "..", "tasks", "common");

// perform the operation to copy task files
let libraries = tasks.map(function (task_name) {

  // determine the target path
  let target = path.join(__dirname, "..", "tasks", task_name);

  common.copyFolderRecursiveSync(common_dir, target);

});

Q.all([libraries])
  .fail(function (err) {
    console.error(err)
    process.exit(1)
  })
