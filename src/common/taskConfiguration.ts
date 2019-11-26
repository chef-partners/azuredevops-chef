/**
 * TaskConfiguration is responsible for reading in all of the task parameters
 * and making them available to the task as an object.
 * 
 * There are a number of helper tasks that exist, such as working out what platform the 
 * task is being run on.
 * 
 * The class will also set up values from the environment when running in DEV mode on a 
 * local workstation
 * 
 * @author Russell Seymour
 */

// import necessary libraries
import * as isRoot from "is-root";
import * as isAdmin from "is-admin";
import {platform} from "os"; // provides information about the operating system being run on
import {sprintf} from "sprintf-js"; // provides sprintf functionaility
import * as tl from "azure-pipelines-task-lib"; // task library for Azure DevOps
import {join as pathJoin} from "path";
import {str as toDotted} from "dot-object";

class Inputs {
  public ComponentName: string = null; // Name of the software component being installed
  public GemName: string = null; // If the component is a gem, state the gem to be installed
  public ForceInstall: boolean = false; // Force the installation of the software
  public UseSudo: boolean = false; // Should Sudo be used for the operations
  public Version: string = null; // The version of the software component to install
  public Channel: string = null; // WHat channel should the software component be installed from
  public TargetPath: string = null; // The path to download software to
}

class Paths {
  public Berks: string = null;
  public Chef: string = null;
  public ChefWorkstationDir: string = null;
  public InspecEmbedded: string = null;
  public Inspec: string = null;
  public Knife: string = null;
  public Script: string = null;

  private taskDir: string = null; // Path to the currently running task folder. This is used to find task specific files.

  /**
   * Depending on the OS the correct defaults will be set on the paths
   * @param osName Name of the operating system that the task is running o
   * @param taskDir Folder of the currently running task
   */
  constructor(osName: string, taskDir: string) {

    let extension: string = "";

    this.taskDir = taskDir;

    tl.debug(sprintf("taskDir=%s", this.taskDir));

    if (osName === "win32") {
      extension = ".bat";
      this.ChefWorkstationDir = pathJoin("C:", "opscode", "chef-workstation");
      this.Inspec = pathJoin("C:", "opscode", "inspec", "bin", "inspec.bat");

      // set the path to the installation script
      this.Script = pathJoin(this.taskDir, "install.ps1");
    } else {
      this.ChefWorkstationDir = pathJoin("/", "opt", "chef-workstation");
      this.Inspec = pathJoin("/", "usr", "bin", "inspec");

      // set the path to the installation script
      this.Script = pathJoin(this.taskDir, "install.sh");
    }

    // set the path to the individual commands based on the workstation dir
    this.Chef = pathJoin(this.ChefWorkstationDir, "bin", sprintf("chef%s", extension));
    this.Berks = pathJoin(this.ChefWorkstationDir, "bin", sprintf("berks%s", extension));
    this.InspecEmbedded = pathJoin(this.ChefWorkstationDir, "bin", sprintf("inspec%s", extension));
    this.Knife = pathJoin(this.ChefWorkstationDir, "bin", sprintf("knife%s", extension));
  }

  /**
   * As InSpec can be installed as a separate smaller package, there can be two locations
   * for it. This method attempts to return the path to inspec, starting with the path to the
   * standalone version.
   * If neither path exists then false is returned
   */
  public GetInspecPath(): string {

    let result: string = null;

    // check to see if the inspec paths exist
    if (tl.exist(this.Inspec)) {
      result = this.Inspec;
    } else if (tl.exist(this.InspecEmbedded)) {
      result = this.InspecEmbedded;
    }

    return result;
  }
}

export class TaskConfiguration {

  // Initialise class properties

  private isDev: boolean = false; // Is the task running in development mode. This is so that the code extracts parameters from the envionment
  public runningAsRoot: boolean = false; // Is process running as a root
  private platformName: string = null;

  public Inputs: Inputs;
  public Paths: Paths; // Set an object containing all the paths. This will have defaults applied if empty based on the OS being run on
  public IsWindows: boolean = false; // State if running on Windows

  // constructor method which will determine some initial settings
  constructor(taskDir: string = null, testPlatform: string = null) {

    // Determine if running in DEV mode
    this.isDev = process.env["NODE_ENV"] && process.env["NODE_ENV"].toUpperCase() === "DEV" ? true : false;

    // determine platform name
    // the testPlatform string can be used if and only if NODE is running in DEV mode
    if (this.isDev && testPlatform != null) {
      this.platformName = testPlatform;
    } else {
      this.platformName = platform();
    }

    // determine defaults based on the platform
    switch (this.platformName) {
      case "win32":
        this.IsWindows = true;
        this.runningAsRoot = isAdmin();
        break;

      case "linux":
        this.runningAsRoot = isRoot();

        break;
      default:

        let msg = sprintf("%s is not a supported platform", this.platformName);
        // if here then the platform is not supported so fail the task
        this.FailTask(msg);
    }

    // Initialise sub classes based on the platform
    this.Paths = new Paths(this.platformName, taskDir);
    this.Inputs = new Inputs();

  }

  public FailTask(msg: string) {
    if (this.isDev) {
      throw new Error(msg);
    } else {
      tl.setResult(tl.TaskResult.Failed, msg, true);
    }
  }

  /**
   * Gets the task parameters for the task
   * 
   * @param required 
   * @param connectedServiceName 
   */
  public async getTaskParameters(connectedServiceName: string = null): Promise<TaskConfiguration> {

    // define a mapping of parameter names to object properties
    let mapping = {
      "component": "Inputs.ComponentName",
      "gemName": "Inputs.GemName",
      "forceInstall": "Inputs.ForceInstall",
      "sudo": "Inputs.UseSudo",
      "version": "Inputs.Version",
      "channel": "Inputs.Channel",
      "targetPath": "Inputs.TargetPath"
    };

    try {
      // iterate around the mapping and set the object values
      for (let paramName in mapping) {

        // Set the property on the object based on the parameter name and the dotted notation
        toDotted(mapping[paramName], this.getParamValue(paramName, false, "input"), this);
      }

      // output information to the log
      console.log("Running as root: %s", await this.runningAsRoot);
      if (!this.IsWindows) {
        console.log("Using sudo: %s", this.Inputs.UseSudo);
      }

    } catch (error) {
      throw new Error(sprintf("Task failed during initialisation. Error: %s", error.message));
    }

    // return the object to the calling function
    return this;
  }

  private getParamValue(name: string, required: boolean, type: string = null, connectedService: string = null): string {

    // initialise variable to hold the return value
    let value = null;

    // if running in development mode get all the value from the environment
    if (this.isDev) {
      value = process.env[name.toUpperCase()];
    } else {

      // based on the type, get the parameter value using the correct method in the task library
      switch (type) {
        case "input":
          // get the value from the task parameters
          value = tl.getInput(name, required);
          tl.debug(sprintf("Retrieved parameter '%s' value: %s", name, value));
      }
    }

    // return the value to the calling function
    return value;
  }
}