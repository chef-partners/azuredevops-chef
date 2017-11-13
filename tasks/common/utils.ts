
export function installChefDK(tl, fs) {
  // determine if installed
  if (!fs.existsSync("/opt/chefdk")) {
    
        console.log("Installing ChefDK");
    
        // download and install ChefDK on the agent
        try {
          let curl_exit_code = tl.tool("curl").line("https://omnitruck.chef.io/install.sh --output /tmp/chefdk_install.sh").execSync();
          let install_exit_code = tl.tool("bash").line("/tmp/chefdk_install.sh -c current -P chefdk").execSync();
        } catch (err) {
          tl.setResult(tl.TaskResult.Failed, err.message);
        }
      } else {
        console.log("ChefDK is installed");
      }
}
