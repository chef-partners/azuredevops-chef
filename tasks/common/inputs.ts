
import { sprintf } from "sprintf-js";
import * as path from "path";
import * as os from "os";
import * as dot from "dot-object";

import * as builtin from "./builtin";

/** Return a hashtable of the inputs */
export function parse(serviceEndpointName, process, tl) {

  // configure the hash table to return
  let inputs = {};
  let builtin_settings = builtin.settings();

  // if the node environment has been set, read the arguments from ENV
  if (process.env.NODE_ENV === "dev") {
    inputs["chefServiceUrl"] = process.env.chefServerUrl;
    inputs["chefUsername"] = process.env.chefUsername;
    inputs["chefUserKey"] = process.env.chefUserKey;

    inputs["chefDKChannel"] = process.env.INPUT_chefDKChannel;
    inputs["chefDKForceInstall"] = process.env.INPUT_chefDKForceInstall;
    inputs["useSudo"] = process.env.INOPUT_useSudo;


    // get the chef environment name
    if (process.env.chefEnvName != null) {
      inputs["chefEnvName"] = process.env.chefEnvName;
    }

    if (process.env.chefCookbookName != null) {
      inputs["chefCookbookName"] = process.env.chefCookbookName;
    }

    if (process.env.chefCookbookVersion != null) {
      inputs["chefCookbookVersion"] = process.env.chefCookbookVersion;
    }

  } else {

    // get teh service endpoint, but only if it has been specified
    if (serviceEndpointName.length > 0) {

      try {
        let connected_service = tl.getInput(serviceEndpointName, true);
        tl.debug(sprintf("Endpoint: %s", JSON.stringify(connected_service)));

        // only attempt to get the endpoint details if the chefServerEndpoint has been set
        if (connected_service != null) {

          // get the necessary inputs from the specified endpoint
          let auth = tl.getEndpointAuthorization(connected_service);

          // get the URL from the endpoint
          inputs["chefServiceUrl"] = tl.getEndpointUrl(connected_service);
          inputs["chefUsername"] = auth.parameters.username;
          inputs["chefUserKey"] = auth.parameters.password;

          // get the value for SSL Verification
          inputs["chefSSLVerify"] = !!+tl.getEndpointDataParameter(connected_service, "sslVerify", true);

          tl.debug(sprintf("SSL Verify: %s", inputs["chefSSLVerify"]));
        }

      }
      catch (err) {
        console.warn(err);
      }
    }

    // create a hash of objects that should be checked for in the parameters passed
    // by the task
    // If a dotted notation string is given as a value then this will created a nested hash
    // within the object that is returned to the calling function
    let input_fields = {
      "chefEnvName": "",
      "chefCookbookName": "",
      "chefCookbookVersion": "",
      "chefCookbookMetadata": "",
      "chefEnvironmentNamespace": "",
      "chefCookbookPath": "",
      "inspecProfilePath": "inspec.profilePath",
      "chefInstallScriptDownloadURLWindows": "",
      "chefInstallScriptDownloadURLLinux": "",
      "inspecInstallScriptDownloadURLWindows": "",
      "inspecInstallScriptDownloadURLLinux": "",
      "chefDKChannel": "chefdk.channel",
      "chefDKVersion": "chefdk.version",
      "chefDKForceInstall": "chefdk.forceInstall",
      "inspecChannel": "inspec.channel",
      "inspecVersion": "inspec.version",
      "inspecForceInstall": "inspec.forceInstall",
      "inspecResultsFile": "inspec.resultsFile",
      "useSudo": "",
      "chefClientLogLevel": "",
      "deletePrivateKey": ""
    };

    let value = "";
    Object.keys(input_fields).forEach(function (input_field) {
      if (tl.getInput(input_field) != null) {

        // get the value of the input
        value = tl.getInput(input_field);

        // for the script download url set the input field accordingly
        if (input_field == "chefInstallScriptDownloadURLWindows" ||
            input_field == "chefInstallScriptDownloadURLLinux") {

            input_field = "chefInstallScriptDownloadURL";

            switch (os.platform()) {
              case "win32": 
               value = tl.getInput("chefInstallScriptDownloadURLWindows");
               break;
              default:
                value = tl.getInput("chefInstallScriptDownloadURLLinux");
            }
        }

        // set the downloads folder accordingly
        if (input_field == "downloadsFolderWindows" ||
            input_field == "downloadsFolderLinux") {

            input_field = "downloadsFolder";

            switch (os.platform()) {
              case "win32": 
                value = tl.getInput("downloadsFolderWindows");
                break;
              default:
                value = tl.getInput("downloadsFolderLinux");
            }
        }

        // determine if there is a string representing the nested hash that is required
        if (input_fields[input_field]) {
          dot.str(input_fields[input_field], value, inputs);
        } else {
          // set the input field value in the inputs array
          inputs[input_field] = value;
        }
      }
    });

    // ensure that defaults have been set if it has not been set in parameters for the task
    if (!("chefInstallScriptDownloadURL" in inputs)) {
      inputs["chefInstallScriptDownloadURL"] = builtin_settings["script_url"];
    }

    if (!("downloadsFolder" in inputs)) {
      inputs["downloadsFolder"] = builtin_settings["paths"]["download"];
    }

  }

  // If running in debug mode output the inputs
  tl.debug(sprintf("Task Inputs: %s", JSON.stringify(inputs)));

  return inputs;
}