
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

      if (tl.getInput("chefSSLVerify") != null) {
        inputs["chefSSLVerify"] = tl.getInput("chefSSLVerify");
      }

    }

    // get the chef environment name
    if (tl.getInput("chefEnvName") != null) {
      inputs["chefEnvName"] = tl.getInput("chefEnvName");
    }

    if (tl.getInput("chefCookbookName") != null) {
      inputs["chefCookbookName"] = tl.getInput("chefCookbookName");
    }

    if (tl.getInput("chefCookbookVersion") != null) {
      inputs["chefCookbookVersion"] = tl.getInput("chefCookbookVersion");
    }

    if (tl.getInput("chefCookbookMetadata") != null) {
      inputs["chefCookbookMetadata"] = tl.getInput("chefCookbookMetadata");
    }
  }

  return inputs;
}