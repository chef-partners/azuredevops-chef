// Import tasks from vsts
import * as tl from "azure-pipelines-task-lib/task";
import {sprintf} from "sprintf-js";

// import necessary common libraries
import * as settings from "./common/settings";

async function run() {

    // initialise variables for resource
    let command = "";
    let command_args = "";
    let proceed = true;
    let command_result;

    // get the settings for this task
    let all_settings = settings.parse("", process, tl);

    // get the inputs for gem
    let gem_inputs = all_settings["inputs"]["gem"];

    // determine if the gem is already installed
    command = "chef";
    command_args = sprintf("gem list -i %s", gem_inputs["name"]);
    tl.debug(sprintf("Gem list command: %s %s", command, command_args));
    command_result = tl.tool(command)
                            .line(command_args)
                            .execSync();

    // turn the output of the command to a boolean value
    let is_installed = (command_result.stdout.trim() === "true");

    console.log("Gem '%s' installed: %s", gem_inputs["name"], String(is_installed));

    // turn the force install into a boolean value
    let force_install = (gem_inputs["forceInstall"] === "true");
    tl.debug(sprintf("Force Install gem '%s': [%s] %s", gem_inputs["name"], typeof force_install, String(force_install)));

    // only install the gem if it is not already installed or forceInstall has been set
    if (proceed && (!is_installed || force_install)) {
        command_args = sprintf("gem install %s", gem_inputs["name"]);

        // if a version has been set add this to the command
        if (gem_inputs["version"] != null) {
            command_args = sprintf(" --version %s", gem_inputs["version"]);
        }

        tl.debug(sprintf("Gem install command: %s %s", command, command_args));
        command_result = tl.tool(command)
            .line(command_args)
            .execSync();

        // ensure that the command ran successfully, if not fail the task
        if (command_result.code !== 0) {
            let fail_message = "Installation of gem failed. Please review errors and try again.";
            tl.setResult(tl.TaskResult.Failed, fail_message);
        }
    }
}

run();