// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import tasks for the filesystem
import * as fs from "fs-extra";

// Import string formatter
import {sprintf} from "sprintf-js";

// Import common tasks
import * as inputs from "./common/inputs";
import * as utils from "./common/utils";
import * as builtin from "./common/builtin";

async function run() {

    // get the built in settings
    let builtin_settings = builtin.settings();

    // Get the parameters that have been set on the task
    let params = inputs.parse("chefsupermarketendpoint", process, tl);

    // set the command that is to be run
    let command = builtin_settings["paths"]["knife"];

    // the private key needs to be written out to a file
    let key_filename: string = builtin_settings["paths"]["private_key"];
    console.log("Writing key file: %s", key_filename);
    try {
        fs.writeFileSync(key_filename, params["chefUserKey"]);
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }

    // if the task is not to perform an SSL checks then the certs need to be
    // downloaded from the chef server
    if (!params["chefSSLVerify"]) {
        console.log("Fetching SSL certificates: %s", params["chefServiceUrl"]);

        // set the agruments to download the SSL certificates
        let command_args = sprintf("ssl fetch %s -u %s -k %s", params["chefServiceUrl"], params["chefUsername"], key_filename);

        try {
            tl.debug(sprintf("SSL Fetch Command: %s %s", command, command_args));
            let command_result: number = await tl.tool(command)
                                   .line(command_args)
                                   .exec();

        } catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    }

    // set the command and the arguments that are to be run
    let command_args = sprintf("cookbook site share %s -o %s -m %s -u %s -k %s", params["chefCookbookName"], params["chefCookbookPath"], params["chefServiceUrl"], params["chefUsername"], key_filename);

    // publish the named cookbook to the supermaket
    try {
        tl.debug(sprintf("Knife command: %s %s", command, command_args));
        let command_result: number = await tl.tool(command)
                               .line(command_args)
                               .exec();

    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }

    // check the option for deleting the private key
    let delete_private_key_option = (params["deletePrivateKey"] === "true");
    if (delete_private_key_option) {
        console.log("Removing Private key: %s", key_filename);
        tl.rmRF(key_filename);
    } else {
        console.warn("Option to delete private key has not been enabled. Please consider using this option so that your Chef private key is not left on the agent");
    }
}

run();
