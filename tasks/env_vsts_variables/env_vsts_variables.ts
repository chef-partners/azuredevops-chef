
// Import library to support promises
import * as Q from "q";

// Import tasks from vsts
import * as tl from "vsts-task-lib/task";

// Import common tasks
import * as inputs from "./common/inputs";
import * as chefapi from "./common/chefapi";

import {sprintf} from "sprintf-js";

function add_vsts_variables_to_env(params, environment) {

    // create an array of variable names that should be not included
    let not_include = ["agent", "release", "system", "build", "task", "MSDEPLOY_HTTP_USER_AGENT", "AZURE_HTTP_USER_AGENT", "requestedForId"];

    // iterate around the variables for the release environment
    let include = true;
    let release_env_vars = tl.getVariables();
    release_env_vars.forEach(function (release_env_var) {

      // reset the include var
      include = true;

      // determine if the varible name begins with one of the not_include vars
      not_include.forEach(function (start_string) {
        if (release_env_var.name.startsWith(start_string)) {
          include = false;
        };
      });

      // only add to the environment of the include is true
      if (include && !release_env_var.secret) {

        // ensure that the environment has override attributes
        if (!("override_attributes" in environment)) {
          environment["override_attributes"] = {};
        }

        // ensure that the namespace is in the override_attributes
        if (!(params["chefEnvironmentNamespace"] in environment["override_attributes"])) {
          environment["override_attributes"][params["chefEnvironmentNamespace"]] = {};
        }

        // Now add the variable and its value to the environment
        environment["override_attributes"][params["chefEnvironmentNamespace"]][release_env_var.name] = release_env_var.value;

        console.log("Added variable to Chef environment: %s", release_env_var.name);
      }
    });

    return environment;
  }

/** Asynchronous function to update environment */
async function run() {

  // Get the parameters that have been set on the task
  let params = inputs.parse("chefServerEndpoint",process, tl);

  // set the path that is to be called
  let path = sprintf("environments/%s", params["chefEnvName"]);

  chefapi.call(tl, params, path, "get", "")
    .then(add_vsts_variables_to_env.bind(null, params))
    .then(chefapi.call.bind(null, tl, params, path, "put"))
    .then(function (response) {
      console.log("Environment variables added");
    })
    .catch(function(error) {
      console.log(error);
    });
}

run();