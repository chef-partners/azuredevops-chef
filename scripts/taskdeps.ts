/*

Node script that ensures all dependencies are installed for a formal build
It will traverse all the tasks and run the necessaary npm install with the correct prefix
This is so that when new tasks are added they do not have to be explictlity added to run commands

*/

import * as path from "path";
import * as fs from "fs-extra";
import * as Q from "q";
import * as child from "child_process";
import {sprintf} from "sprintf-js";

// Iterate around the tasks
function get_tasks() {
  let task_dir = path.join(__dirname, "../tasks");
  return fs.readdirSync(path.join(__dirname, '../tasks')).filter(function (file) {
    return ['common', 'typings'].indexOf(file.toLowerCase()) < 0
      && fs.statSync(path.join(task_dir, file)).isDirectory();
  })
}

function status(error, stdout, stderr) {
  console.log(stdout);
  console.log(stderr);
}

function installDeps() {

  let tasks = get_tasks();

  // iterate around the tasks and run the depdencies
  let task_files = tasks.map(function (task_name) {

    // build up the command to run
    let cmd = sprintf("npm install --prefix build/tasks/%s tasks/%s", task_name, task_name);

    // run the command to install the depdencies
    child.exec(cmd, status);

  });

}

installDeps();
