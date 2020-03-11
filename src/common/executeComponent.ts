import { TaskConfiguration } from "./taskConfiguration";

/**
 * ExecuteComponent is responsible for executing the command that has been selected
 * using the chosen arguments.
 * 
 * @author Russell Seymour
 */

 /**
  * Class to handle the execution of the selected component
  */
export class ExecuteComponent {

  /**
   * TaskConfiguration object containing all of the supplied parameters
   * and paths
   */
  private taskConfiguration: TaskConfiguration;

  /**
   * Create a new instance of the class, the constructor
   * 
   * @param taskConfiguration The current tas configuration
   */
  constructor (taskConfiguration: TaskConfiguration) {
    this.taskConfiguration = taskConfiguration;
  }

  /**
   * Execute determines the component to be executed, the path to that component (based
   * on the platform), any credentials that are required and then runs that command with
   * any arguments that have been specified
   */
  public async Execute() {




  }

  /**
   * generateCmd builds up the command that should be executed
   * It is not meant to be called externally, but is a public method so that it can be tested
   */
  public generateCmd(): string[] {
    // initalise the method vars
    let cmdParts: string[] = [];
    let cmd: string = "";

    // it might be necessary to run with Sudo on linux, so determine the platform being
    // run on to see if this should be added to the cmdParts


    // Based on the selected component get the path to it
    cmdParts.push(
      this.taskConfiguration.Paths.GetPath(
        this.taskConfiguration.Inputs.ComponentName
      )
    );

    // if there are any arguments add them to the command
    if (this.taskConfiguration.Inputs.Arguments !== "") {
      cmdParts.push(
        this.taskConfiguration.Inputs.Arguments
      );
    }

    return cmdParts;
  }
}