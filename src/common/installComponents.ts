import { TaskConfiguration } from "./taskConfiguration";
import { Utils } from "./utils";
import { sprintf } from "sprintf-js";
import * as tl from "azure-pipelines-task-lib"; // task library for Azure DevOps
import { IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";
import { Scripts } from "./scripts";
import { writeFileSync } from "fs";

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
   * Utils object containing common methods
   */
  public utils: Utils;

  /**
   * Creates a new instance of the class
   * 
   * @param taskConfiguration The current task configuration
   */
  constructor (taskConfiguration: TaskConfiguration) {
    this.taskConfiguration = taskConfiguration;
    this.utils = new Utils(this.taskConfiguration);
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
    let shouldInstall: boolean = this.shouldInstall();

    // Get the command to perform the installation
    tl.debug(sprintf("ShouldInstall: %s", shouldInstall));
    if (shouldInstall) {
      let cmd = this.installCmd();

      // Attempt to execute the command
      try {
        let result = this.utils.ExecCmd(cmd);
      } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
      }
    }
  }

  /**
   * Decode the script for the platform the agent is run on and write it
   * out to disk
   */
  public WriteScript() {

    // initialise variables
    let scripts = new Scripts();
    let script: string = scripts.GetScript(this.taskConfiguration.IsWindows);

    // write out the script to the filename
    tl.debug(sprintf("Writing out Chef install script: %s", this.taskConfiguration.Paths.Script));
    writeFileSync(this.taskConfiguration.Paths.Script, script, "utf-8");

    // check that the file has been written out properyl, it not raise an error
    if (!scripts.VerifyScript(this.taskConfiguration.IsWindows, this.taskConfiguration.Paths.Script)) {
      tl.setResult(tl.TaskResult.Failed, "Chef install script was not written out successfully", true);
    }

  }

  /**
   * Determine if the component should be installed or not
   * 
   * This is a public method so that the logic can be tested
   */
  public shouldInstall(): boolean {

    let msg: string;
    let shouldInstall: boolean = false;

    // determine if the component is installed
    let installed = this.isInstalled();
    let sudoInstalled = this.utils.IsSudoInstalled();

    // if running as root then can be installed
    // however if not then the operating system needs to be looked at and a sudo check performed
    if (this.taskConfiguration.runningAsRoot) {
      shouldInstall = true;
    } else {

      if (this.taskConfiguration.IsWindows === true) {

        // if the os is Windows then leave as false with an error message
        msg = "Agent must be running with Elevated Privileges to install software";
        this.taskConfiguration.FailTask(msg);
      } else {

        // the os is not windows so check to see if sudo use has been allowed
        if (this.taskConfiguration.Inputs.SudoIsSet()) {

          // check that sudo is installed
          if (sudoInstalled) {
            shouldInstall = true;
          } else {
            msg = "The option to UseSudo has been set but Sudo is not installed";
            this.taskConfiguration.FailTask(msg);
          }
        } else {
          msg = "Agent must be running as root or the option to Use Sudo must be enabled to install software";
          this.taskConfiguration.FailTask(msg);
        }

      }
    }

    // Finally determine if the component should be installed based on whether it is or not
    // and if force install has been set
    if (shouldInstall === true) {
      if (installed === true && this.taskConfiguration.Inputs.ForceIsSet() === false) {
        msg = "Component is already installed";
        tl.setResult(tl.TaskResult.Skipped, msg);
        shouldInstall = false;
      }
    }

    return shouldInstall;
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

      // write out the script
      this.WriteScript();

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
        cmdParts = this.utils.CheckSudo();

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
            "-P",
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



  /**
   * Method to determine if the selected component is installed or not
   * 
   * If running in DEV mode then environment variables are used to test
   * the installation valued
   */
  public isInstalled(): boolean {
    let installed: boolean = false;

    if (this.taskConfiguration.isDev) {

      installed = (process.env.INSTALLED === "true");

    } else {
      // determine if the component is installed or not
      if (this.taskConfiguration.Inputs.ComponentName === "gem") {
        // For gems this involves running the command to see if the gem is installed
        // in the context of chef. The command is retrieved and then executed

        // execute the command to check if the gem is installed or not
        let result = this.utils.ExecCmd(this.isGemInstalledCmd());

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
}