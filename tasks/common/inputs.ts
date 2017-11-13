
import { sprintf } from "sprintf-js";

/** Return a hashtable of the inputs */
export function parse(serviceEndpointName, process, tl) {

  // configure the hash table to return
  let inputs = {};

  // if the node environment has been set, read the arguments from ENV
  if (process.env.NODE_ENV === "dev") {
    inputs["chefServiceUrl"] = process.env.chefServerUrl;
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