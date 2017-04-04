// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import tasks for the filesystem
import * as fs from "fs-extra";

import {sprintf} from "sprintf-js";

// Function to check if ChefDK is installed and if not install it
function installChefDK() {

  // determine if installed
  if (!fs.existsSync("/opt/chefdk")) {

    console.log("Installing ChefDK");

    // download and install ChefDK on the agent
    try {

      let exit_code: number = tl.tool("bash").arg("curl https://omnitruck.chef.io/install.sh | bash -s -- -c current -P chefdk").exec();
    } catch (err) {
      tl.setResult(tl.TaskResult.Failed, err.message);
    }
  } else {
    console.log("ChefDK is installed");
  }

}

// Function to ensure that the configuration files are in place for communicating with the Chef Server
function configureChef(chef_server_url, nodename, key) {

  // ensure that the chef directory exists
  if (!fs.existsSync("/etc/chef")) {
    console.log("Creating configuration directory: /etc/chef");
    fs.mkdirSync("/etc/chef");
  }

  // determine the filename of the key
  let key_filename: string = sprintf("/etc/chef/%s.pem", nodename);

  // write out the user key to the file
  try {
    fs.writeFileSync(key_filename, key);
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }

  // write out the configuration file for knife
  let config = `node_name  "${nodename}"
  client_key  "${key_filename}"
  chef_server_url "${chef_server_url}"
  `;

  // write out the configuration file
  try {
    fs.writeFileSync("/etc/chef/knife.rb", config);
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

async function run() {

  // ensure chefdk is installed
  installChefDK();

  // install the necessary cookbook dependencies
  try {
    let exit_code: number = await tl.tool("/opt/chefdk/bin/berks").arg("install").exec();
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }

  // upload the cookbook to the chef server
  try {
    let exit_code: number = await tl.tool("/opt/chefdk/bin/berks").arg("upload").exec();
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }

}

run();