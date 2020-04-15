/**
 * Utils contains a number of methods that are reused throughout the extension
 * For example, checkSudo when running on Linux
 * 
 * @author Russell Seymour
 */

import * as tl from "azure-pipelines-task-lib"; // task library for Azure DevOps
import { IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";
import { TaskConfiguration } from "./taskConfiguration";
import { sprintf } from "sprintf-js";

export class Utils {

  /**
   * TaskConfiguration object containing all of the supplied parameters
   * and paths
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
   * ExecCmd takes a string array of the command an arguments and stitches
   * them together into one command line. This is then executed and the result
   * returned to the calling function.
   *
   * @param parts String array of command and arguments
   */
  public ExecCmd(parts: string[]): IExecSyncResult {

    // get the command from the string so that it can be set as the command
    // on the Task library
    let cmd = parts.shift();
    let args = parts.join(" ");

    // execute the command
    let result = tl.tool(cmd).line(args).execSync();

    return result;
  }

  /**
   * checkSudo determines if sudo is to be used
   * it also checks that sudo has been configured properly for the agent user
   */
  public CheckSudo(): string[] {
    let parts: string[] = [];
    let result: IExecSyncResult;

    if (this.taskConfiguration.Inputs.SudoIsSet() && this.IsSudoInstalled()) {

      console.log("Determine if Sudo requires a password");

      // build up a command to check if a password is required or not
      let sudoParts = ["sudo", "-n", "true"];
      result = this.ExecCmd(sudoParts);

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

  public IsSudoInstalled(): boolean {
    return tl.exist(this.taskConfiguration.Paths.Sudo);
  }
}