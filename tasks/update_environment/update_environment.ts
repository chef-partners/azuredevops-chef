
// Import library to support promises
import * as Q from "q";

// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import common tasks
import * as inputs from "./common/inputs";
import * as chefapi from "./common/chefapi";

import {sprintf} from "sprintf-js";

function update_environment(params, environment) {

  // ensure that the cookbook versions is set on the object
  if (!("cookbook_versions" in environment)) {
    environment["cookbook_versions"] = {};
  }

  environment["cookbook_versions"][params["chefCookbookName"]] = params["chefCookbookVersion"];

  // return the envrionment so that it can be sent
  return environment;

}

/** Asynchronous function to update environment */
async function run() {

  // Get the parameters that have been set on the task
  let params = inputs.parse(process, tl);

  // set the path that is to be called
  let path = sprintf("environments/%s", params["chefEnvName"]);

  chefapi.call(tl, params, path, "get", null)
    .then(update_environment.bind(null, params))
    .then(chefapi.call.bind(null, tl, params, path, "put"))
    .then(function (response) {
      console.log("Environment Constraints Updated");
      console.log("  Name: %s", response.name);
      console.log("  Cookbook: %s", params["chefCookbookName"]);
      console.log("  Version: %s", response.cookbook_versions[params["chefCookbookName"]]);
    })
    .catch(function(error) {
      console.log(error);
    });
}

run();