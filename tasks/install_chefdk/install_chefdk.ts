// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import tasks for the filesystem
import * as fs from "fs-extra";

import * as utils from "./common/utils";
import * as inputs from "./common/inputs";

async function run() {
    // Get the parameters that have been set on the task
    let params = inputs.parse("", process, tl);

    // Call function to install ChefDK
    utils.install("chefdk", tl, fs, params);

};

run();