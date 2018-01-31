// Import tasks from vsts
import * as tl from "vsts-task-lib/task";
import {sprintf} from "sprintf-js";

// import necessary common libraries
import * as settings from "./common/settings";

async function run() {

    // initialise variables for resource
    let command = "knife";
    let config = false;

    // get the settings for this task
    let all_settings = settings.parse("knifeEndpoint", process, tl);

    // if the option to not use ssl verification is set, then this needs to be written
    // out to the knife configuration file
    if (!all_settings["inputs"]["chefSSLVerify"]) {

        // create the necessary knife configuration
        let knife_config = "ssl_verify_mode     :verify_none";

        // write out the configuration file
        try {
            tl.writeFile(all_settings["paths"]["knife_config"], knife_config);
        } catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }

        // set the config to true so that it is appended to the knife command
        config = true;
    }

    // parse the keywords in the knife arguments and replace with the values
    // from the specified endpoint
    let knife_arguments = all_settings["inputs"]["knife"]["arguments"];
    knife_arguments = knife_arguments.replace(/{URL}/, all_settings["inputs"]["chefServiceUrl"]);
    knife_arguments = knife_arguments.replace(/{USERNAME}/, all_settings["inputs"]["chefUsername"]);
    knife_arguments = knife_arguments.replace(/{PASSWORD}/, all_settings["inputs"]["chefUserKey"]);

    // if config is enabled add the configuration option to the end of the command
    if (config) {
        knife_arguments += sprintf(" --config %s", all_settings["paths"]["knife_config"]);
    }

    // if the private key is to be used then write it out and set it on the arguments
    let use_private_key = (all_settings["inputs"]["knife"]["privateKey"] === "true");
    if (use_private_key) {

        console.log("Writing private key: %s", all_settings["paths"]["private_key"]);

        // determine the filename of the key
        let key_filename: string = all_settings["paths"]["private_key"];

        // write out the user key to the file
        try {
            tl.writeFile(key_filename, all_settings["inputs"]["chefUserKey"]);
        } catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }

        // append the key path to the arguments
        knife_arguments += sprintf(" --key %s", key_filename);
    }

    // build up the command to run
    try {
        tl.debug(sprintf("Knife command: %s %s", command, knife_arguments));
        let command_result: number = await tl.tool(command)
                            .line(knife_arguments)
                            .exec();
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }

    // check the option for deleting the private key
    let delete_private_key_option = (all_settings["inputs"]["deletePrivateKey"] === "true");
    if (delete_private_key_option) {
        if (tl.exist(all_settings["paths"]["private_key"])) {
            console.log("Removing Private key: %s", all_settings["paths"]["private_key"]);
            tl.rmRF(all_settings["paths"]["private_key"]);
        }
    } else {
        console.warn("Option to delete private key has not been enabled. Please consider using this option so that your Chef private key is not left on the agent");
    }

}

run();