import { TaskConfiguration } from "./taskConfiguration";
import { sprintf } from "sprintf-js";
import * as tl from "azure-pipelines-task-lib"; // task library for Azure DevOps
import { IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";

/**
 * InstallComponents is responsible for taking in the TaskConfiguration
 * and working out what is to be installed depending on the platform.
 * 
 * This means that on Windows PowerShell will be used and on Linux it will be bash.
 * 
 * @author Russell Seymour
 */

 /**
  * Class to handle the installation of Chef software components
  */
export class InstallComponents {

  /**
   * TaskConfiguration object containing all the supplied parameters
   * and paths.
   */
  private taskConfiguration: TaskConfiguration;

  /**
   * Creates a new instance of the class
   * 
   * @param taskConfiguration The current task configuration
   */
  constructor (taskConfiguration: TaskConfiguration) {
    this.taskConfiguration = taskConfiguration;
  }

  /**
   * Install determines if the component is already installed and then
   * determine if it needs to be installed. This takes into account if the ForceInstall
   * option has been set
   */
  public async Install() {

    // Determine if the component is installed
    let installed = this.isInstalled();
    let msg: string;
    let shouldInstall: boolean = true;

    // if the component is not installed or force install has been set
    // install it
    if (!installed || this.taskConfiguration.Inputs.ForceInstall) {

      console.log("Installing Component: %s %s", this.taskConfiguration.Inputs.ComponentName, this.taskConfiguration.Inputs.GemName);

      // check that the agent is running with the correct privileges
      if (!this.taskConfiguration.runningAsRoot) {
        if (this.taskConfiguration.IsWindows) {

          msg = "Agent must be running with Elevated Privileges to install software";
          this.taskConfiguration.FailTask(msg);
          shouldInstall = false;

        } else {
          if (!this.taskConfiguration.Inputs.UseSudo) {
            msg = "Agent must be running as root or the option to Use Sudo must be enabled to install software";
            this.taskConfiguration.FailTask(msg);
            shouldInstall = false;
          }
        }
      }
    }

    // Get the command to perform the installation
    if (shouldInstall) {
      let cmd = this.installCmd();

      // Attempt to execute the command
      try {
        let result = this.execCmd(cmd);
      } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
      }
    }    
  }

  /**
   * installCmd builds up the command to install the specified component
   * It is not meant to be called externally, but it is a public method so that
   * it can be tested
   */
  public installCmd(): string[] {
    // initialise method vars
    let cmdParts: string[] = [];

    if (this.taskConfiguration.Inputs.ComponentName === "gem") {
      // build up the command that will install a gem in the context of chef
      // as chef is going to be used to perform the installation, there is no
      // need to check for the operating system that this being run on
      cmdParts = [
        "chef",
        "gem",
        "install",
        this.taskConfiguration.Inputs.GemName
      ];

      // if a version has been specified add it to the command
      if (this.taskConfiguration.Inputs.Version) {
        cmdParts.push(
          "--version",
          this.taskConfiguration.Inputs.Version
        );
      }
      

    } else {
      // determine if a targetPath has been specified, and if it has check that it exists
      // if it does not exist, return a message and set the error flag
      if (this.taskConfiguration.Inputs.TargetPath) {
        if (!tl.exist(this.taskConfiguration.Inputs.TargetPath)) {
          let msg = sprintf("Unable to find installation file: %s", this.taskConfiguration.Inputs.TargetPath);
          this.taskConfiguration.FailTask(msg);
        }
      }

      // use the flag to determine if running on Windows to build up the install command
      if (this.taskConfiguration.IsWindows) {
        cmdParts = [
          "powershell.exe",
          "-Command",
          this.taskConfiguration.Paths.Script,
          ";",
          "Install-Project"
        ];

        // add more parts to the cmd based on whether the targetPath has been set or not
        if (this.taskConfiguration.Inputs.TargetPath) {
          cmdParts.push(
            "-Filename",
            this.taskConfiguration.Inputs.TargetPath
          );
        } else {

          // installation will be performed using the download method from the script
          cmdParts.push(
            "-Project",
            this.taskConfiguration.Inputs.ComponentName,
            "-Channel",
            this.taskConfiguration.Inputs.Channel
          );

          // add the version if it has been specified
          if (this.taskConfiguration.Inputs.Version) {
            cmdParts.push(
              "-Version",
              this.taskConfiguration.Inputs.Version
            );
          }
        }

      } else {

        // determine if using Sudo to perform the installation
        cmdParts = this.checkSudo();

        cmdParts.push("bash");

        cmdParts.push(this.taskConfiguration.Paths.Script);

        // determine if a targetpath has been set 
        if (this.taskConfiguration.Inputs.TargetPath) {
          cmdParts.push(
            "-f",
            this.taskConfiguration.Inputs.TargetPath
          );
        } else {

          // installation will be performed using the download method from the script
          cmdParts.push(
            "-p",
            this.taskConfiguration.Inputs.ComponentName,
            "-c",
            this.taskConfiguration.Inputs.Channel
          );

          // add the verson if it has been specified
          if (this.taskConfiguration.Inputs.Version) {
            cmdParts.push(
              "-v",
              this.taskConfiguration.Inputs.Version
            );
          }
        }
      }
    }

    return cmdParts;
  }

  private isInstalled(): boolean {
    let installed: boolean = false;

    // determine if the component is installed or not
    if (this.taskConfiguration.Inputs.ComponentName === "gem") {
      // For gems this involves running the command to see if the gem is installed
      // in the context of chef. The command is retrieved and then executed

      // execute the command to check if the gem is installed or not
      let result = this.execCmd(this.isGemInstalledCmd());

      // if the result contains true then it is installed
      installed = (result.stdout.trim() === "true");
    } else {

      // When checking for ChefWorkstation or InSpec check the paths
      switch (this.taskConfiguration.Inputs.ComponentName) {
        case "chef-workstation":
          installed = tl.exist(this.taskConfiguration.Paths.ChefWorkstationDir);
          break;
        case "inspec":
          let inspecInstalled = this.taskConfiguration.Paths.GetInspecPath();
          if (inspecInstalled) {
            installed = tl.exist(inspecInstalled);
          }
          break;
      }
    }

    return installed;
  }

  /**
   * isInstalledCmd builds up the command to determine if the application is already
   * installed or not.
   */
  public isGemInstalledCmd(): string[] {

    let cmdParts: string[] = [];

    // determine if the component is installed or not
    cmdParts = [
      "gem",
      "list",
      "-i",
      this.taskConfiguration.Inputs.GemName
    ];

    return cmdParts;
  }

  /**
   * checkSudo determines if sudo is to be used
   * it also checks that sudo has been configured properly for the agent user
   */
  private checkSudo(): string[] {
    let parts: string[] = [];

    if (this.taskConfiguration.Inputs.UseSudo) {

      console.log("Determine if Sudo requires a password");

      // build up a command to check if a password is required or not
      parts = ["sudo", "-n", "true"];
      let result = this.execCmd(parts);

      tl.debug(sprintf("Sudo check result: %s", result.stderr));

      // check the result to see if a password is required
      // if it is throw an error and fail the task
      if (/^sudo: a password is required/.test(result.stderr)) {
        let msg = "A password is required for Sudo. Please configure the agent account to run sudo without a password";
        this.taskConfiguration.FailTask(msg);
      } else {
        console.log("    No (NOPASSWD appears to be enabled for the agent account)");

        // set sudo on the parts
        parts.push("sudo");
      }
    }

    // return to the calling function
    return parts;
  }

  private execCmd(parts: string[]): IExecSyncResult {

    // get the command from the string so that it can be set as the command
    // on the Task library
    let cmd = parts.shift();
    let args = parts.join(" ");

    // execute the command
    let result = tl.tool(cmd).line(args).execSync();

    return result;
  }
}