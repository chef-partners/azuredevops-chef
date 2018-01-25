// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

import {sprintf} from "sprintf-js";

import * as path from "path";

// Improt task libraries
import * as settings from "./common/settings";
import * as utils from "./common/utils";

async function run() {

    // get the builtin settings so that the task can find where inspec should be run from
    let builtin_settings = settings.parse("", process, tl);

    // get the parameters that have been passed to the task
    let params = builtin_settings["inputs"];

    let chef_installed = utils.isInstalled("chef", tl);
    tl.debug(sprintf("chef_installed: [%s] %s", typeof chef_installed, String(chef_installed)));

    // only attempt to run the linting tasks if the chef command is available
    if (chef_installed) {

        // build up the command that is to be run
        let command = builtin_settings["paths"]["chef"];
        let command_arguments = "exec bundle";

        try {
            tl.debug(sprintf("Gem install command: %s %s", command, command_arguments));
            let command_result: number = await tl.tool(command)
                                .line(command_arguments)
                                .exec(<any>{cwd: path.normalize(params["gemfile"]["folder"])});
        } catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }

    } else {

        // Chef-client path has not been found so fail the task
        let message = sprintf("Chef is not available on this machine. Please install ChefDK.");
        tl.setResult(tl.TaskResult.Failed, message);
    }
}

run();