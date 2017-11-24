// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import tasks for the filesystem
import * as fs from "fs-extra";

import * as path from "path";

import {sprintf} from "sprintf-js";

// Import common tasks
import * as inputs from "./common/inputs";

import * as os from "os";

// Install Inspec
function installInspec() {

    // detect the operating system so that the correct installation procedure is used
    switch (os.platform()) {
        case "linux":

            // determine if it is installed or not
            if (!fs.existsSync("/usr/bin/inspec")) {

                console.log("Installing Inspec for Linux");

                try {
                    let curl_exit_code = tl.tool("curl").line("https://omnitruck.chef.io/install.sh --output /tmp/inspec_install.sh").execSync();
                    let install_exit_code = tl.tool("bash").line("/tmp/inspec_install.sh -c current -P inspec").execSync();
                } catch (err) {
                    tl.setResult(tl.TaskResult.Failed, err.message);
                }
            } else {
                console.log("Inspec is installed");
            }

            break;
        case "win32":

            // determine if it is installed or not
            if (!fs.exsistsSync("C:\\opscode\\inspec\\bin\\inspec.bat")) {

                console.log("Installing Inspec for Windows");

                try {

                    let install_exit_code = tl.tool("powershell.exe").arg("-Command").arg(". { iwr -useb https://omnitruck.chef.io/install.ps1 } | iex; install -project inspec").exec();

                } catch (err) {
                    tl.setResult(tl.TaskResult.Failed, err.message);
                }
            } else {
                console.log("Inspec is installed");
            }

            break;
        default:
            console.log("Operating system not supported: %s", os.platform());
    }
}

async function run() {

    // get the parameters that have been passed to the task
    let params = inputs.parse("", process, tl);

    // call the installation with the version to install
    installInspec();

    let inspec_path = "";

    // run inspec
    switch (os.platform()) {
        case "linux":

            // set the path to the executable to run
            inspec_path = "/usr/bin/inspec";

            break;

        case "win32":

            // set the path to the executable to run
            inspec_path = "C:\\opscode\\inspec\\bin\\inspec.bat";

            break;
    }

    // check that the profile path exists
    if (fs.existsSync(params["inspecProfilePath"])) {

        // run inspec using the paths worked out
        try {

            console.log("Running Inspec profiles: %s", params["inspecProfilePath"]);

            // execute the tests in the specified path
            // Inspec is run with the `cwd` of the inspec profile path
            let exit_code: number = await tl.tool(inspec_path).arg("exec").arg(".").arg("--format junit").arg("> inspec.out").exec(<any>{cwd: path.normalize(params["inspecProfilePath"])});
        } catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }

    } else {

        tl.setResult(tl.TaskResult.Failed, sprintf("Cannot find Inspec profile path: %s", params["inspecProfilePath"]));
    }
}

run();