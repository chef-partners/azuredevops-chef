/*
Script that copies the built code into a new preview directory

Each of the tasks will then be updated so that their names and titles have PREVIEW appended to them
This is so that people that are using the extension know thay the task they are
using is a preview version and does not clash with the production version
*/

import * as path from "path";
import * as fs from "fs-extra";
import * as common from "./common";
import {sprintf} from "sprintf-js";
import * as Q from "q";
import * as uuid from "uuidv5";

export function create (options, build_config) {

  console.log("Creating preview extension");

  // determine the paths to the production and preview builds
  let prod_dir = path.join(build_config.dirs.output, "production");
  let preview_dir = path.join(build_config.dirs.output, "preview");

  // Create UUID namespace
  // This is so that new namespaces can be generated for the preview
  // so that they are "unique" but are always generated the same
  let namespace = uuid("null", "bf19db30-199e-4f3d-ab1a-bc5eb01bebe2", true);

  // recusrively copy the production code to preview
  try {
    fs.copySync(prod_dir, preview_dir, { dereference: true } );
  } catch (err) {
    console.error(err);
  }

  console.log("Patching preview tasks");

  // get a list of the preview tasks
  let preview_tasks = common.get_tasks(path.join(preview_dir, "tasks"));

  // for each task patch the task.json so that it has a preview appended to it
  let patching = preview_tasks.map(function (task_name) {

      // create the uuid for the task, this needs to be overwritten from the production version
      // so that it has a unique name
      let task_id = uuid(namespace, sprintf("vsts-chef-tasks.%s.preview", task_name));

      let task_manifest_file = path.join(preview_dir, "tasks", task_name, "task.json");

      let task_manifest = JSON.parse(fs.readFileSync(task_manifest_file, "utf8"));

      console.log("  Task: %s", task_name);

      console.log("    reset task id");
      task_manifest.id = task_id;

      console.log("    add preview suffix to id");
      task_manifest.name = sprintf("%s-preview", task_manifest.name);

      console.log("    add PREVIEW suffix to title");
      task_manifest.friendlyName = sprintf("%s - PREVIEW", task_manifest.friendlyName);

      fs.writeFileSync(task_manifest_file, JSON.stringify(task_manifest, null, 4));
  });

  Q.all([patching])
  .fail(function (err) {
    console.error(err);
    process.exit(1);
  });

}