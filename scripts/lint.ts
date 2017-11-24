import * as path from "path";
import * as fs from "fs-extra";
import * as Q from "q";
import * as common from "./common";
import {sprintf} from "sprintf-js";
import * as child from "child_process";

export function files(options) {
    console.log("Linting TypeScript files");

    // find a list of the task files that need to be tested
    // this is done so that any node_modules directories containng typescript files are not inadvertently
    // tested
    let tasks = common.get_tasks();
    let task_dir = "";
    // let task_file = "";
    // let files = [];

    let task_ts_files = tasks.map(function (task_name) {

        let task_files = [];
        let files = [];

        // determine the task dir
        task_dir = path.join(options.parent.tasksdir, task_name);

        // filter out the typescript files
        task_files = fs.readdirSync(task_dir).filter(function (file) {
            if (path.extname(file) === ".ts" && fs.statSync(path.join(task_dir, file)).isFile()) {
                return file;
            }
        });

        for (let task_file of task_files) {
            files.push(path.join("tasks", task_name, task_file));
        }

        return files;
    });

    // join the task_ts_files together
    let files_to_lint = task_ts_files.join(" ");

    // create the command to perform the linting task
    let cmd = sprintf("%s -c %s scripts/*.ts %s", options.parent.tslintpath, options.tslintconfig, files_to_lint);

    // execute the command and retrieve the error code. this is so that the
    // build will fail if there are errors in the linting
    try {
      child.execSync(cmd);
    } catch (error) {
      console.error("There are linting errors");
      console.log(error.stdout.toString());
      process.exit(2);
    }
  }