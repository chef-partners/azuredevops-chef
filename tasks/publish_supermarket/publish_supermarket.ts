// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import tasks for the filesystem
import * as fs from "fs-extra";

// Import string formatter
import {sprintf} from "sprintf-js";

// Import common tasks
import * as inputs from "./common/inputs";
import * as utils from "./common/utils";

async function run() {

    // ensure that chefdk is installed
    utils.installChefDK(tl, fs);

    // Get the parameters that have been set on the task
    let params = inputs.parse("chefSupermarketEndpoint", process, tl);

    // set the command and the arguments that are to be run
    let cmd = "/opt/chefdk/bin/knife";
    let args = sprintf("cookbook site share %s -o %s -m %s -u %s -k %s", params["chefCookbookName"], params["chefCookbookPath"], params["chefUsername"], params["chefUserKey"]);

    // publish the named cookbook to the supermaket
    try {
        let exit_code: number = await tl.tool(cmd).line(args).exec();
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();
