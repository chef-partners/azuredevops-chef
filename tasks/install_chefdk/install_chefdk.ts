// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

import * as utils from "./common/utils";
import * as settings from "./common/settings";

async function run() {
    // Get the parameters that have been set on the task
    let all_settings = settings.parse("", process, tl);

    // Call function to install ChefDK
    utils.install("chefdk", tl, all_settings["inputs"]);

};

run();