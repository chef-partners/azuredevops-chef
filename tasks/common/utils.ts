
import * as os from "os";
import * as path from "path";
import { sprintf } from "sprintf-js";
import * as elevated from "is-elevated";
import * as Q from "q";

import * as settings from "./settings"

function windowsInstall(name, tl, builtin_settings, inputs) {

  let command = "";
  let command_args = "";
  let command_exit_code = 0;

  try {
    
    // determine the commands and arguments that need to be run
    // There are two steps to this
    //  1. Downlaod the script
    //  2. Execute the script and install ChefDK
    // This has to be done in three stages because the VSTS agent does not seem to like using the | command
    command = "powershell.exe";

    // Download the setup script
    command_args = sprintf("-Command Invoke-WebRequest -UseBasicParsing %s -OutFile %s", inputs["chefInstallScriptDownloadURL"], builtin_settings["paths"]["download"]);
    tl.debug(sprintf("Download Script Command: %s %s", command, command_args));
    command_exit_code = tl.tool(command)
                          .line(command_args)
                          .execSync();

    // Build up the command to execute the downloaded script
    // This has to be chained together because the module in the script only lasts for the session in which is it is sourced
    // So the installation of ChefDK has to be chained onto the end in one command
    command_args = sprintf("-Command Invoke-Expression -Command %s; Install-Project -Project %s -Channel %s", builtin_settings["paths"]["download"], builtin_settings[name]["project"], inputs[name]["channel"]);

    // determine if a version has been set an append to the command if it has
    if (inputs[name]["version"] != null) {
      command_args = sprintf("%s -Version %s", command_args, inputs[name]["version"]);
    }

    tl.debug(sprintf("Execute Script Command: %s %s", command, command_args));
    command_exit_code = tl.tool(command)
                          .line(command_args)
                          .execSync();

  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

function linuxInstall(name, tl, builtin_settings, inputs, use_sudo) {

  let command = "";
  let command_args = "";
  let command_exit_code = 0;

  try {
    
    // set the command and arguments to download the script
    command = "curl";
    command_args = sprintf("%s --output %s", inputs["chefInstallScriptDownloadURL"], builtin_settings["paths"]["download"]);
    tl.debug(sprintf("Download Script Command: %s %s", command, command_args));
    let curl_exit_code = tl.tool(command)
                            .line(command_args)
                            .execSync();

    // Determine if sudo needs to be used and modify the command and arguments accordingly
    let command_args_prepend = "";
    if (use_sudo) {

      console.log("Determine if sudo requires a password");

      // run command to see if a password is required otherwise
      // if it is then sudo has not been setup for password less use
      let command_result = tl.tool("sudo")
                             .line("-n true")
                             .execSync();

      // if the stderr of this command states a password is required fail the build
      if (/^sudo: a password is required/.test(command_result.stderr)) {
        throw new Error("A password is required for Sudo. Please configure the agent account to run sudo without a password");
      } else {
        console.log("    No (NOPASSWD appears to be enabled for the agent account)");
      }

      command = "sudo";
      command_args_prepend = "bash ";
    } else {
      console.log("If installation fails you may need to enable sudo for the agent account with the NOPASSWD option");
      command = "bash";
    }

    command_args = sprintf("%s%s -P %s -c %s", command_args_prepend, builtin_settings["paths"]["download"], builtin_settings[name]["project"], inputs[name]["channel"]);

    // determine if a version has been set an append to the command if it has
    if (inputs[name]["version"] != null) {
      command_args = sprintf("%s -v %s", command_args, inputs[name]["version"]);
    }

    tl.debug(sprintf("Install Script Command: %s %s", command, command_args));

    let install_exit_code = tl.tool(command)
                              .line(command_args)
                              .execSync();

  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }  
}

export function install(name, tl, inputs) {

  let builtin_settings = settings.parse("", process, tl);
  
  tl.debug(JSON.stringify(builtin_settings));

  // ensure that the channel has been set, if not default it
  if (!("channel" in inputs[name])) {
    inputs[name]["channel"] = "current";
  }

  // determine if the built agent is running as root / admin or not
  let install_promise = elevated().then(function (isElevated) {

    let force_install = (inputs[name]["forceInstall"] == 'true');
    let software_installed = tl.exist(builtin_settings["paths"][name]);
    tl.debug(sprintf("Force Install '%s': [%s] %s", name, typeof force_install, String(force_install)));
    tl.debug(sprintf("'%s' Path: %s [Installed? %s]", name, builtin_settings["paths"][name], String(software_installed)));
    if (!software_installed || force_install) {

      console.log("Installing Software: %s", name);

      // determine the platform that the installation is being attempted on
      // For Windows the installation can only occur if running as Administrator
      // For Linux if this is not the case then sudo can be used if allowed
      switch (os.platform()) {
        case "win32":

          console.log("... Windows");

          // if not running elevated then fail the build
          if (isElevated) {
            // call function to install on Windows
            windowsInstall(name, tl, builtin_settings, inputs);            
          } else {
            tl.setResult(tl.TaskResult.Failed, "Agent must be running with Elevated Privileges to install software");
          }

          break;
        default:

        console.log("... Linux");

          // determine if sudo should be used with the commands to install
          // this will only work if the useSudo input has been set
          let sudo_option = (inputs["useSudo"] == 'true');
          tl.debug(sprintf("isElevated: [%s] %s", typeof isElevated, String(isElevated)));
          tl.debug(sprintf("sudo_option: [%s] %s", typeof sudo_option, String(sudo_option)));
          if (!isElevated && !sudo_option) {
            tl.setResult(tl.TaskResult.Failed, "Agent must be running as root or the option to use Sudo must be enabled");
          } else {
            // determine if sudo should be used or not
            let use_sudo = false;
            !isElevated && sudo_option ? use_sudo = true : false;

            tl.debug(sprintf("use_sudo: [%s] %s", typeof use_sudo, String(use_sudo)));

            // call function to install on Linux
            linuxInstall(name, tl, builtin_settings, inputs, use_sudo);
          }

      }

    } else {
      console.log("Software '%s' is installed: %s", name, builtin_settings["paths"][name]);
    }
  });

  // use Q to wait for the install operation to complete
  Q.all([install_promise])
  .fail(function (err) {
    console.error(err);
    process.exit(1);
  });

}

export function isInstalled(name, tl) {

    // get the built in settings
    let builtin_settings = settings.parse("", process, tl);

    // determine if the named software is installed or not
    return tl.exist(builtin_settings["paths"][name]);
}
