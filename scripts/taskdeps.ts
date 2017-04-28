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
import * as common from './common';
import {sprintf} from "sprintf-js";

function status(error, stdout, stderr) {
  console.log(stdout);
  console.log(stderr);
}

function installDeps() {

  let tasks = common.get_tasks();

  // determine the base path to work from
  let base_path = process.cwd();

  // iterate around the tasks and run the depdencies
  let task_files = tasks.map(function (task_name) {

    // change to the task directory
    let taskdir = sprintf("%s/tasks/%s", base_path, task_name);
    console.log(taskdir);
    process.chdir(taskdir);

    // create command so that the modules are in place during compilation
    let npm_compile_install_cmd = "npm install";
    child.exec(npm_compile_install_cmd, status);

    // create command for the dependencies at run time
    let npm_runtime_install_cmd = sprintf("npm install --prefix %s/build/tasks/%s .", base_path, task_name);

    // run the command to install the depdencies
    child.exec(npm_runtime_install_cmd, status);

  });

}

installDeps();
