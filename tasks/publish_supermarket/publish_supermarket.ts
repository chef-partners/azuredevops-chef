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

    // set the knife cmd to run
    let cmd = "/opt/chefdk/bin/knife";

    // ensure that chefdk is installed
    utils.installChefDK(tl, fs);

    // Get the parameters that have been set on the task
    let params = inputs.parse("chefsupermarketendpoint", process, tl);

    // the private key needs to be written out to a file
    let key_filename: string = "/tmp/supermarket.pem";
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
        let args = sprintf("ssl fetch %s -u %s -k %s", params["chefServiceUrl"], params["chefUsername"], key_filename);

        try {
            let exit_code: number = await tl.tool(cmd).line(args).exec();
        } catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    }

    // set the command and the arguments that are to be run
    let args = sprintf("cookbook site share %s -o %s -m %s -u %s -k %s", params["chefCookbookName"], params["chefCookbookPath"], params["chefServiceUrl"], params["chefUsername"], key_filename);

    // publish the named cookbook to the supermaket
    try {
        let exit_code: number = await tl.tool(cmd).line(args).exec();
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();
