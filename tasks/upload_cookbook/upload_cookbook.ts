// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import tasks for the filesystem
import * as fs from "fs-extra";

import {sprintf} from "sprintf-js";

// Import common tasks
import * as settings from "./common/settings";

// Function to ensure that the configuration files are in place for communicating with the Chef Server
function configureChef(chef_server_url, nodename, key, sslVerify, settings) {

  // determine the filename of the key
  let key_filename: string = settings["paths"]["private_key"];

  // write out the user key to the file
  try {
    fs.writeFileSync(key_filename, key);
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }

  // create the necessary configuration file for berkshelf
  let berks_config = {
    "chef": {
      "chef_server_url": chef_server_url,
      "client_key": key_filename,
      "node_name": nodename
    },
    "ssl": {
      "verify": sslVerify
    }
  };

  // write out the configuration file
  try {
    fs.writeFileSync(settings["paths"]["berks_config"], JSON.stringify(berks_config));
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

async function run() {

  // get the builtin settings
  let builtin_settings = settings.parse("chefServerEndpoint", process, tl);

  // Get the parameters that have been set on the task
  let params = builtin_settings["inputs"];

  // configure chef
  configureChef(params["chefServiceUrl"], params["chefUsername"], params["chefUserKey"], params["chefSSLVerify"], builtin_settings);

  // change to the correct directory to upload the cookbook
  console.log("CD to cookbook directory: %s", params["chefCookbookPath"]);
  try {
    process.chdir(params["chefCookbookPath"]);
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }

  // set the command that is going to run
  let command = builtin_settings["paths"]["berks"];
  let command_args = "";

  // install the necessary cookbook dependencies
  try {
    command_args = "install";
    tl.debug(sprintf("Berks command: %s %s", command, command_args));
    let exit_code: number = await tl.tool(command)
                                    .line(command_args)
                                    .exec();
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }

  // upload the cookbook to the chef server
  try {
    command_args = sprintf("upload -c %s", builtin_settings["paths"]["berks_config"]);
    tl.debug(sprintf("Berks command: %s %s", command, command_args));
    let exit_code: number = await tl.tool(command)
                                    .line(command_args)
                                    .exec();
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }

  // check the option for deleting the private key
  let delete_private_key_option = (params["deletePrivateKey"] === "true");
  if (delete_private_key_option) {
      console.log("Removing Private key: %s", builtin_settings["paths"]["private_key"]);
      tl.rmRF(builtin_settings["paths"]["private_key"]);
  } else {
      console.warn("Option to delete private key has not been enabled. Please consider using this option so that your Chef private key is not left on the agent");
  }

}

run();