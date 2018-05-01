// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

import * as path from "path";

import * as Q from "q";

import {sprintf} from "sprintf-js";

// Import common tasks
import * as utils from "./common/utils";
import * as settings from "./common/settings";

import * as os from "os";

async function run() {

    // get the builtin settings so that the task can find where inspec should be run from
    let builtin_settings = settings.parse("", process, tl);

    // get the parameters that have been passed to the task
    let params = builtin_settings["inputs"];

    // normalise the path to the inspec profile so that is correct for the platform
    let inspec_profile_path = path.normalize(params["inspec"]["profilePath"]);
    let inspec_results_path = path.normalize(params["inspec"]["resultsFile"]);
    let inspec_arguments = path.normalize(params["inspec"]["arguments"]);

    // ensure that inspec is installed
    let inspec_installed = utils.isInstalled("inspec", tl);
    tl.debug(sprintf("inspec_installed: [%s] %s", typeof inspec_installed, String(inspec_installed)));
    if (inspec_installed) {
        // check that the profile path exists
        if (tl.exist(params["inspec"]["profilePath"])) {

            // run inspec using the paths worked out
            try {

                console.log("Running Inspec profiles: %s", inspec_profile_path);

                // Determine the version of InSpec that is being used so that the test results
                // are specified correctly
                let inspec_version = tl.tool('inspec -v')
                                     .execSync();
                console.log("InSpec Version: %s", inspec_version);                                     
                let major = parseInt(inspec_version.stdout.split('.')[0]);
                let test_output_args = "";
                if (major == 1) {
                    test_output_args = sprintf('--format junit > %s', inspec_results_path);
                } else if (major > 1) {
                    test_output_args = sprintf('--reporter junit:%s', inspec_results_path);
                }

                // set the command and the arguments to run
                let command = builtin_settings["paths"]["inspec"];
                let command_args = sprintf("exec . %s %s", inspec_arguments, test_output_args);

                tl.debug(sprintf("InSpec Command [%s]: %s %s", inspec_profile_path, command, command_args));

                // execute the tests in the specified path
                // Inspec is run with the `cwd` of the inspec profile path
                let command_result = tl.tool(command)
                                    .line(command_args)
                                    .execSync(<any>{cwd: path.normalize(inspec_profile_path)});

                // check the exit code for errors
                if (command_result.code !== 0) {
                    let fail_message = "InSpec tests failed. Please review errors and try again.";
                    tl.setResult(tl.TaskResult.Failed, fail_message);
                }

            } catch (err) {
                tl.setResult(tl.TaskResult.Failed, err.message);
            }

        } else {

            tl.setResult(tl.TaskResult.Failed, sprintf("Cannot find Inspec profile path: %s", inspec_profile_path));
        }
    } else {
        tl.setResult(tl.TaskResult.Failed, "InSpec is not installed. Please use the 'Install InSpec' task");
    }
}

run();