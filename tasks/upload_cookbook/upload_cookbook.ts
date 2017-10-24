// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import tasks for the filesystem
import * as fs from "fs-extra";

import {sprintf} from "sprintf-js";

// Import common tasks
import * as inputs from "./common/inputs";
import * as utils from "./common/utils";

// Function to ensure that the configuration files are in place for communicating with the Chef Server
function configureChef(chef_server_url, nodename, key, sslVerify) {

  // determine the filename of the key
  let key_filename: string = sprintf("/tmp/%s.pem", nodename);

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
    fs.writeFileSync("/tmp/berks.config.json", JSON.stringify(berks_config));
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

async function run() {

  // ensure chefdk is installed
  utils.installChefDK(tl, fs);

  // Get the parameters that have been set on the task
  let params = inputs.parse("chefServerEndpoint", process, tl);

  // configure chef
  configureChef(params["chefServiceUrl"], params["chefUsername"], params["chefUserKey"], params["chefSSLVerify"]);

  // change to the correct directory to upload the cookbook
  console.log("CD to cookbook directory: %s", params["chefCookbookPath"]);
  try {
    process.chdir(params["chefCookbookPath"]);
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }

  // install the necessary cookbook dependencies
  try {
    let exit_code: number = await tl.tool("/opt/chefdk/bin/berks").line("install").exec();
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }

  // upload the cookbook to the chef server
  try {
    let exit_code: number = await tl.tool("/opt/chefdk/bin/berks").line("upload -c /tmp/berks.config.json").exec();
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();