// Import the necessary tasks
import * as task from "../common/taskConfiguration";
import * as ex from "../common/executeComponent";

// Execute the chosen Chef component command with the specified arguments
async function run() {

  // initialise the required classes
  let taskConfiguration = new task.TaskConfiguration();

  // get the parameters for the task, e.g. the settings that have been provided
  await taskConfiguration.getTaskParameters();

  // create an instance of the executeComponent class
  let executeComponent = new  ex.ExecuteComponent(taskConfiguration);

  // perform the execution of the selected command
  executeComponent.Execute();
}

run ();