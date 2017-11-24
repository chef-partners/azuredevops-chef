/*

Node script that ensures all dependencies are installed for a formal build
It will traverse all the tasks and run the necessaary npm install with the correct prefix
This is so that when new tasks are added they do not have to be explictlity added to run commands

*/

import * as path from "path";
import * as fs from "fs-extra";
import * as Q from "q";
import * as child from "child_process";
import * as process from "process";
import * as common from "./common";
import {sprintf} from "sprintf-js";

function status(error, stdout, stderr) {
  console.log(stdout);
  console.log(stderr);
}

export function install(options, build_config) {

  console.log("Install task dependencies");

  let build_path = path.join(build_config.dirs.output, "production");
  let build_task_node_modules_path = "";

  let tasks = common.get_tasks();

  // iterate around the tasks and run the depdencies
  let task_files = tasks.map(function (task_name) {

    console.log("   %s", task_name);

    // change to the task directory
    let taskdir = path.join(options.parent.tasksdir, task_name);
    console.log(taskdir);
    process.chdir(taskdir);

    // install the necessary dependencies for the task
    let npm_compile_install_cmd = "npm install";
    child.execSync(npm_compile_install_cmd);

    // determine the build path for the task
    build_task_node_modules_path = path.join(build_path, "tasks", task_name, "node_modules");

    // ensure that the build task path exists
    if (!fs.existsSync(build_task_node_modules_path)) {
      fs.mkdirsSync(build_task_node_modules_path);
    }

    // copy the node_modules to the task in the build folder
    fs.copySync(path.join(taskdir, "node_modules"), build_task_node_modules_path);

  });

}