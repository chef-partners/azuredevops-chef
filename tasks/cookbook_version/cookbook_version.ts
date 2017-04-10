// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

import * as Q from "q";

// Import tasks for the filesystem
import * as fs from "fs-extra";

import * as replace from "replace";

import {sprintf} from "sprintf-js";

// create search and replace function
function searchReplaceInFile(pattern, replacement, filename) {

  return Q.Promise(function(resolve, notify, reject) {

    let file = fs.createReadStream(filename, "utf-8");
    let updated = "";

    console.log("Pattern: %s", pattern);
    console.log("Replacement: %s", replacement);

    file.on("data", function (chunk) {
      updated += chunk.toString().replace(/#{pattern}/, replacement);
    });

    file.on("end", function () {
      console.log(updated);
      fs.writeFile(filename, updated, function(err) {
        if (err) {
          console.log(err);
          reject(new Error(err));
        } else {
          console.log("Updated cookbook version");
        }
      });
    });
  });
}

async function run() {

  console.log("Attempting to set cookbook version: %s", tl.getVariable("Build.BuildNumber"));

  //searchReplaceInFile("^version.*$", sprintf("version '%s'", tl.getVariable("Build.BuildNumber")), "metadata.rb")
  //.catch(function(err) {
  //  console.log(err);
  //});

  // replace the version number in the metadata file
  replace({
    regex: "^version.*$",
    replacement: sprintf("version '%s'", tl.getVariable("Build.BuildNumber")),
    paths: ["metadata.rb"]
  });
};

run();