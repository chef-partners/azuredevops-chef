
import * as common from "./common";
import * as path from "path";
import * as Q from "q";
import * as fs from "fs-extra";

// retrieve all the task directories
let tasks = common.get_tasks();

// determine the path to the common dir
let common_dir = path.join(__dirname, "..", "tasks", "common");

// set the tasks and the libs that each requires
let tasks_with_libs = {
  "chefapi.ts": [
    "env_version_constraint",
    "env_vsts_variables"
  ],
  "inputs.ts": [
    "cookbook_version",
    "env_version_constraint",
    "env_vsts_variables",
    "exec_inspec",
    "publish_supermarket",
    "upload_cookbook"
  ],
  "utils.ts": [
    "publish_supermarket",
    "upload_cookbook"
  ]
}

// iterate around the tasks with libs
// the key is the file to copy and the value is an array of the tasks that require the file
let libraries = Object.keys(tasks_with_libs).map(function (libfile, task_list) {

  // perform operation to copy library file
  tasks.map(function (task_name) {

      // if the task is in the array of tasks for this file then copy the file
      if (tasks_with_libs[libfile].indexOf(task_name) > -1) {
        
        // determine the src and target path
        let source = path.join(common_dir, libfile);
        let target = path.join(__dirname, "..", "tasks", task_name, "common");
  
        // ensure that the target directory exists
        if (!fs.existsSync(target)) {
          fs.mkdirSync(target)
        }

        common.copyFileSync(source, target);
  
        console.log("Copying '%s' to task: %s", libfile, task_name)
      }
  });
});

Q.all([libraries])
  .fail(function (err) {
    console.error(err)
    process.exit(1)
  })
