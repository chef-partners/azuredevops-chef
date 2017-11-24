// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import tasks for the filesystem
import * as fs from "fs-extra";

import * as path from "path";

import {sprintf} from "sprintf-js";

import * as os from "os";

async function run() {

    // set a variable to hold the pat of the chef-client
    let chef_client_path = "";

    // work out the path for chef client
    switch (os.platform()) {
        case "linux":

            chef_client_path = "/usr/bin/chef-client";

            break;

        case "win32":

            chef_client_path = "c:\\opscode\\chef\\bin\\chef-client.bat";

            break;
    }

    // only attempt to run chef-client of the path exsist
    if (fs.existsSync(chef_client_path)) {

        // run chef-client with the --once option
        let exit_code: number = await tl.tool(chef_client_path).arg("--once").exec();

    } else {
        tl.setResult(tl.TaskResult.Failed, sprintf("Chef Client is not available: %s", chef_client_path));
    }
}

run();