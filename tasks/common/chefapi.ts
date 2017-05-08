
import * as Q from "q";
import * as crypto from "crypto";
import * as https from "https";
import * as moment from "moment";
import * as url from "url";
import {sprintf} from "sprintf-js";

let node_rsa = require("node-rsa");

/** Exported function to call the Chef API and return the result */
export function call(tl, config, path: string, method: string, body: string) {

  // if the body has been set then ensure it is a string
  if (body !== "") {
    body = JSON.stringify(body);
  }

  // parse the URL of the server so it can be used to configure the request
  let chef_server_url = url.parse(config["chefServerUrl"]);

  // configure the path that is to be called
  let api_path = sprintf("%s/%s", chef_server_url.path, path);

  // build up the options of the call
  let options = {
    host: chef_server_url.host,
    path: api_path,
    headers: getHeaders(api_path, method, body, config["chefUsername"], config["chefUserKey"]),
    method: method.toUpperCase(),
    rejectUnauthorized: config["chefSSLVerify"]
  };

  // output debug information
  tl.debug(sprintf("Options: %s", JSON.stringify(options)));

  // Return a promise for the API Call
  return Q.Promise(function(resolve, notify, reject) {

    // create a request to the API
    let request = https.request(options, function(res) {

      // output status of the request
      console.log(sprintf("Got response: %s", res.statusCode));

      // define variable to recive the data
      let data = "";

      // each time data is recieved add it to the data variable
      res.on("data", function(chunk) {
        console.log("Data received");
        data += chunk;
      });

      // when the response has completed get the data
      res.on("end", function() {
        if (res.statusCode === 200) {
          // callback(JSON.parse(data), config)
          resolve(JSON.parse(data));
        } else {
          console.log(sprintf("%s: %s%s: %s", options.method, options.host, options.path, res.statusCode));
          reject(new Error(sprintf("%s%s: %s", options.method, options.host, options.path, res.statusCode)));
        }

      });
    });

    // output any errors to the console
    request.on("error", function(e) {
      tl.setResult(tl.TaskResult.Failed, e.stack);
    });

    // if the method is POST or PUT then write the body
    if (method === "put" || method === "post") {
      request.write(body);
    }

    request.end();

  });

}

/** Build up the headers required for the call */
function getHeaders(path, method, body, username, userkey) {

  // define variables that will be used in the headers and signing the request
  let timestamp = moment.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";

  // create the content hash of the body
  let content_hash = sha1(body);

  // build up the hash table of headers
  let headers = {
    "Accept": "application/json",
    "X-Ops-Sign": "algorithm=sha1;version=1.0",
    "X-Ops-Userid": username,
    "X-Ops-Timestamp": timestamp,
    "X-Ops-Content-Hash": content_hash,
    "X-Chef-Version": "12.0.2",
    "X-Ops-Server-API-Version": 1
  };

  // if using PUT or POST add the content type
  if (method === "put" || method === "post") {
    headers["Content-Type"] = "application/json";
  }

  // Call the method to build up the authorisation for this API request
  let authorization = generateAuthorization(method, path, content_hash, username, userkey, timestamp);

  // split up the authorization into lines 60 characters long and add each
  // segment to the headers
  let auth_parts = authorization.match(/.{1,60}/g);
  auth_parts.forEach((part, index) => {
    headers[sprintf("X-Ops-Authorization-%s", index + 1)] = part;
  });

  // return the headers
  return headers;
}

/** Returns the SHA1 hash of the specified string  */
function sha1(data) {
  let generator = crypto.createHash("sha1");
  generator.update(data);
  return generator.digest("base64");
}

/** Using the passed data create the authorization */
function generateAuthorization(method, path, content_hash, username, userkey, timestamp) {

  // create array to hold the auth components
  let al = [];

  al.push(sprintf("Method:%s", method.toUpperCase()));
  al.push(sprintf("Hashed Path:%s", sha1(path)));
  al.push(sprintf("X-Ops-Content-Hash:%s", content_hash));
  al.push(sprintf("X-Ops-Timestamp:%s", timestamp));
  al.push(sprintf("X-Ops-UserId:%s", username));

  // stitch the list together
  let canonicalized_header = al.join("\n");

  // create a key object from the userkey
  let priv_key = new node_rsa(userkey, "pkcs1");

  // encrypt the canonicalized_header with the private key
  let encrypted = priv_key.encryptPrivate(canonicalized_header, "base64");

  // return the encrypted string
  return encrypted;
}