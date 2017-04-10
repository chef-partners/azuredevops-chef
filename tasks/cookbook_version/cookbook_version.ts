// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import tasks for the filesystem
import * as fs from "fs-extra";

import {sprintf} from "sprintf-js";

// Import common tasks
import * as inputs from "./common/inputs";

async function run() {

  console.log("Setting cookbook version: %s", tl.getVariable("Build.BuildNumber"));

  // read in the contents of the metadata.rb file
  fs.readFileSync("metadata.rb", "utf-8", function (err, data) {

    // if there is an error output to the console
    if (err) {
      return console.log(err);
    }

    // replace the version line of the metadata file
    let updated_metadata = data.replace(/^version.*$/, sprintf("version '%s'", tl.getVariable("Build.BuildNumber")));

    // write out the version to the metadata file
    fs.writeFileSync("metadata.rb", updated_metadata, "utf-8", function (err) {
      if (err) {
        return console.log(err);
      }
    });

  });
};

run();