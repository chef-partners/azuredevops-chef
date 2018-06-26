// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

import {sprintf} from "sprintf-js";

import * as path from "path";

// import necessary common libraries
import * as settings from "./common/settings";
import * as utils from "./common/utils";

async function run() {

    // get the settings for this task
    let all_settings = settings.parse("tkAzureEndpoint", process, tl);
    let params = all_settings["inputs"];

    let chef_installed = utils.isInstalled("chef", tl);
    tl.debug(sprintf("chef_installed: [%s] %s", typeof chef_installed, String(chef_installed)));

    // only attempt to run the linting tasks if the chef command is available
    if (chef_installed) {

        // set the environment variables required to allow TK to access Azure
        tl.setVariable("KITCHEN_YAML", params["tk"]["file"]);
        tl.setVariable("AZURE_CLIENT_ID", params["azure_creds"]["client_id"]);
        tl.setVariable("AZURE_CLIENT_SECRET", params["azure_creds"]["client_secret"]);
        tl.setVariable("AZURE_TENANT_ID", params["azure_creds"]["tenant_id"]);

        // build up the command that is to be run
        let command = all_settings["paths"]["chef"];
        let command_arguments = "exec kitchen test";

        try {
            tl.debug(sprintf("Kitchen command: %s %s", command, command_arguments));
            let command_result: number = await tl.tool(command)
                                .line(command_arguments)
                                .exec(<any>{cwd: path.normalize(params["tk"]["folder"])});
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