// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

import * as Q from "q";

import * as replace from "replace";

import {sprintf} from "sprintf-js";

import * as inputs from "./common/inputs";

async function run() {

  // Get the parameters that have been set on the task
  let params = inputs.parse(process, tl);

  console.log("Attempting to set cookbook version: %s", params["chefCookbookVersion"]);

  // replace the version number in the metadata file
  replace({
    regex: /version\s+['"].*['"]/,
    replacement: sprintf("version '%s'", params["chefCookbookVersion"]),
    paths: [params["chefCookbookMetadata"]]
  });
};

run();