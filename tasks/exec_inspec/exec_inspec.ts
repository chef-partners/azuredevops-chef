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
    let inspec_arguments = params["inspec"]["arguments"];

    // ensure that inspec is installed
    let inspec_installed = utils.isInstalled("inspec", tl);
    tl.debug(sprintf("inspec_installed: [%s] %s", typeof inspec_installed, String(inspec_installed)));
    if (inspec_installed) {
        // check that the profile path exists
        if (tl.exist(params["inspec"]["profilePath"])) {

            // run inspec using the paths worked out
            try {

                console.log("Running Inspec profiles: %s", inspec_profile_path);

                let command = builtin_settings["paths"]["inspec"];
                let command_args = "";
                let command_result;

                // Determine the version of InSpec that is being used so that the test results
                // are specified correctly
                console.log("Getting InSpec version");
                command_args = "-v";
                command_result = tl.tool(command)
                                     .line(command_args)
                                     .execSync();

                // the value we need is from the first line of the output so split on
                // the \n character and get the version number
                let inspec_version = command_result.stdout.split("\n")[0].trim();

                console.log("InSpec Version: %s", inspec_version);
                let major = parseInt(inspec_version.split(".")[0]);
                let test_output_args = "";
                if (major === 1) {
                    test_output_args = sprintf("--format junit > %s", inspec_results_path);
                } else if (major > 1) {
                    test_output_args = sprintf("--reporter cli junit:%s", inspec_results_path);
                }

                // set the command and the arguments to run
                command_args = sprintf("exec %s %s", inspec_arguments, test_output_args);

                tl.debug(sprintf("InSpec Command [%s]: %s %s", inspec_profile_path, command, command_args));

                // execute the tests in the specified path
                // Inspec is run with the `cwd` of the inspec profile path
                command_result = tl.tool(command)
                                    .line(command_args)
                                    .execSync(<any>{cwd: path.normalize(inspec_profile_path)});

                // output any information on stdout
                console.log(command_result.stdout);

                // check the exit code for errors, these are different for versions of InSpec
                if (major === 1) {
                    if (command_result.code !== 0) {
                        console.log(command_result.stderr);
                        console.log(command_result.error);
                        let fail_message = "InSpec tests failed. Please review errors and try again.";
                        tl.setResult(tl.TaskResult.Failed, fail_message);
                    }
                } else if (major > 1) {
                    // there are different exit codes based on the success or not of the run
                    // 0: successful run
                    // 100: successful run with failures
                    // 101: successful run with skipped
                    // fail the build if the values do not match the above
                    // or produce warnings if 100 or 101
                    if (command_result.code !== 0 &&
                        command_result.code !== 100 &&
                        command_result.code !== 101) {

                        console.log(command_result.stderr);
                        console.log(command_result.error);
                        let fail_message = "InSpec tests failed. Please review errors and try again.";
                        tl.setResult(tl.TaskResult.Failed, fail_message);

                    } else if (command_result.code === 100 || command_result.code === 101) {

                        // create message
                        let warn_message = "";
                        switch (command_result.code) {
                            case 100:
                                warn_message = "Execution was successful but some tests have failed";
                                break;
                            case 101:
                                warn_message = "Execution was successful but some tests were skipped";
                                break;
                        }

                        console.log("##vso[task.logissue type=warning]%s", warn_message);

                    } else if (command_result.code === 0) {
                        tl.setResult(tl.TaskResult.Succeeded, "InSpec tests were successful");
                    } else {
                        // everything else is an error
                        console.log(command_result.stderr);
                        console.log(command_result.error);
                        let fail_message = "InSpec tests failed. Please review errors and try again.";
                        tl.setResult(tl.TaskResult.Failed, fail_message);
                    }

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