// Import the necessary tasks
import * as task from "./common/taskConfiguration";
import * as ic from "./common/installComponents";
import { dirname } from "path";

// Perform the install operation
async function run() {

  // initialise required classes
  // the basename of __filename is used rather than __dirname because when it 
  // is run under the Azure DevOps agent __dirname resolves to /
  let taskConfiguration = new task.TaskConfiguration(dirname(__filename));

  await taskConfiguration.getTaskParameters();

  let installComponent = new ic.InstallComponents(taskConfiguration);

  // perform the installation of the specified component
  installComponent.Install();
}

run();