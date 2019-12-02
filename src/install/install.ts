// Import the necessary tasks
import * as task from "./common/taskConfiguration";
import * as ic from "./common/installComponents";
import { dirname, join as pathJoin } from "path";
import { readdirSync } from "fs";

// Perform the install operation
async function run() {

  // initialise required classes
  let taskConfiguration = new task.TaskConfiguration();

  await taskConfiguration.getTaskParameters();

  let installComponent = new ic.InstallComponents(taskConfiguration);

  // perform the installation of the specified component
  installComponent.Install();
}

run();