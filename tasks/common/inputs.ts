
import {sprintf} from "sprintf-js";

/** Return a hashtable of the inputs */
export function parse(process, tl) {

  // configure the hash table to return
  let inputs = {};

  // if the node environment has been set, read the arguments from ENV
  if (process.env.NODE_ENV === "dev") {
    inputs["chefServerUrl"] = process.env.chefServerUrl;
    inputs["chefUsername"] = process.env.chefUsername;
    inputs["chefUserKey"] = process.env.chefUserKey;

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

    // only attempt to get the endpoint details if the chefServerEndpoint has been set
    if (tl.getInput("chefServerEndpoint") != null) {

      // get the necessary inputs from the specified endpoint
      let auth = tl.getEndpointAuthorization(tl.getInput("chefServerEndpoint", true));

      // get the URL from the endpoint
      inputs["chefServerUrl"] = tl.getEndpointUrl(tl.getInput("chefServerEndpoint"), true);
      inputs["chefUsername"] = auth.parameters.username;
      inputs["chefUserKey"] = auth.parameters.password;

      // decode the base64 encoding of the userkey
      inputs["chefUserKey"] = Buffer.from(inputs["chefUserKey"], "base64").toString("utf8");

      // get the value for SSL Verification
      inputs["chefSSLVerify"] = !!+auth.parameters.sslVerify

      tl.debug(auth)
      tl.debug(auth.parameters)
      tl.debug(auth.parameters.sslVerify)
      tl.debug(sprintf("SSL Verify: %s", inputs["chefSSLVerify"]))
    }

    // create array of inputs that should be checked for
    let input_fields = [
      "chefEnvName",
      "chefCookbookName",
      "chefCookbookVersion",
      "chefCookbookMetadata",
      "chefEnvironmentNamespace",
      "chefCookbookPath",
      "inspecProfilePath"
    ];

    input_fields.forEach(function (input_field) {
      if (tl.getInput(input_field) != null) {
        inputs[input_field] = tl.getInput(input_field);
      }
    });

  }

  return inputs;
}