// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import tasks for the filesystem
import * as fs from "fs-extra";
import * as path from "path";
import {sprintf} from "sprintf-js";
import * as os from "os";

// Import necessary libs from the common libs
import * as settings from "./common/settings";

async function run() {

    // get the builtin settings to find the path to chef-client on Windows and Linux
    let builtin_settings = settings.parse("", process, tl);

    // get the inputs to the task so that the options can be set
    let params = builtin_settings["inputs"];

    // only attempt to run chef-client of the path exsist
    if (!builtin_settings["paths"]["chefclient"]) {

        // Chef-client path has not been found so fail the task
        let message = sprintf("Chef Client is not available on this machine. Please install the ChefDK or 'chef-client'");
        tl.setResult(tl.TaskResult.Failed, message);
    } else {

        // configure the command and the arguments
        let command = builtin_settings["paths"]["chefclient"];
        let command_args = sprintf("--once -l %s", params["chefClientLogLevel"]);

        tl.debug(sprintf("Chef Client Command: %s %s", command, command_args));

        // run chef-client with the --once option
        let command_result = tl.tool(command)
                          .line(command_args)
                          .execSync();

        // check the command_result and if it exited with anything other than 0 fail the task
        if (command_result.code !== 0) {
            let fail_message = "Chef Client did not complete successfully. Pleas review errors and try again.";
            tl.setResult(tl.TaskResult.Failed, fail_message);
        }

    }
}

run();