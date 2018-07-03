import { sprintf } from "sprintf-js";
import * as path from "path";
import * as os from "os";
import * as dot from "dot-object";
import * as tl from "vsts-task-lib/task";

function standard() {
    // intialise variables
    let settings = {
        "script_url": "",
        "chefdk": {
            "project": "chefdk"
        },
        "inspec": {
            "project": "inspec",
        },
        "paths": {
            "download": "",
            "chefdk": "",
            "chefclient": ""
        },
        "linting": {
            "actions": {
                "chefspec": "spec",
                "chefstyle": "style:chefstyle",
                "foodcritic": "style:foodcritic"
            }
        },
        "inputs": {}
    };

    let chefclient_paths = [];

    // Based on the operating system work out the defaults for the different
    // folders and downloads
    switch (os.platform()) {
        case "win32":
            // configure the default settings for a windows agent
            settings["script_url"] = "https://omnitruck.chef.io/install.ps1";
            settings["paths"]["download"] = path.join("c:", "windows", "temp", "chef-install.ps1");
            settings["paths"]["chefdk"] = path.join("c:", "opscode", "chefdk");
            settings["paths"]["inspec"] = path.join("c:", "opscode", "inspec", "bin", "inspec.bat");
            settings["paths"]["knife"] = path.join(settings["paths"]["chefdk"], "bin", "knife.bat");
            settings["paths"]["berks"] = path.join(settings["paths"]["chefdk"], "bin", "berks.bat");
            settings["paths"]["chef"] = path.join(settings["paths"]["chefdk"], "bin", "chef.bat");

            // define where the private key should be written out when using knife
            settings["paths"]["private_key"] = path.join("c:", "windows", "temp", "vsts-task.pem");

            // set where the configuration file for berks should be written to 
            settings["paths"]["berks_config"] = path.join("c:", "windows", "temp", "berks.config.json");

            // define where the configuration file for knife should be stored
            // this is so that SSL verification can be set
            settings["paths"]["knife_config"] = path.join("c:", "windows", "temp", "knife.rb");

            // set an array for where chef-client will usually be installed
            // this is so that the one in the ChefDK will be used if it is installed.
            chefclient_paths = [
                path.join("c:", "opscode", "chef", "bin", "chef-client.bat"),
                path.join(settings["paths"]["chefdk"], "bin", "chef-client.bat")
            ];

            break;
        default:
            // configure the default settings for non windows agent
            settings["script_url"] = "https://omnitruck.chef.io/install.sh";
            settings["paths"]["download"] = path.join("/", "tmp", "chef-install.sh");
            settings["paths"]["chefdk"] = path.join("/", "opt", "chefdk");
            settings["paths"]["inspec"] = path.join("/", "usr", "bin", "inspec");
            settings["paths"]["knife"] = path.join(settings["paths"]["chefdk"], "bin", "knife");
            settings["paths"]["berks"] = path.join(settings["paths"]["chefdk"], "bin", "berks");
            settings["paths"]["chef"] = path.join(settings["paths"]["chefdk"], "bin", "chef");

            // define where the private key should be written out when using knife
            settings["paths"]["private_key"] = path.join("/", "tmp", "vsts-task.pem");

            // set where the configuration file for berks should be written to 
            settings["paths"]["berks_config"] = path.join("/", "tmp", "berks.config.json");

            // define where the configuration file for knife should be stored
            // this is so that SSL verification can be set
            settings["paths"]["knife_config"] = path.join("/", "tmp", "knife.rb");

            // set an array for where chef-client will usually be installed
            // this is so that the one in the ChefDK will be used if it is installed.
            chefclient_paths = [
                path.join("/", "usr", "bin", "chef-client"),
                path.join(settings["paths"]["chefdk"], "bin", "chef-client")
            ];
    }

    // iterate around the chefclient_paths and set the one that exists
    for (let chefclient_path of chefclient_paths) {
        if (tl.exist(chefclient_path)) {
            settings["paths"]["chefclient"] = chefclient_path;
            break;
        }
    }

    // return the settings to the calling function
    return settings;
}

export function parse(serviceEndpointName, process, tl) {
    
      // Get the standard settings
      let settings = standard();
    
      // if the node environment has been set, read the arguments from ENV
      if (process.env.NODE_ENV === "dev") {
        settings["inputs"]["chefServiceUrl"] = process.env.chefServerUrl;
        settings["inputs"]["chefUsername"] = process.env.chefUsername;
        settings["inputs"]["chefUserKey"] = process.env.chefUserKey;
    
        settings["inputs"]["chefDKChannel"] = process.env.INPUT_chefDKChannel;
        settings["inputs"]["chefDKForceInstall"] = process.env.INPUT_chefDKForceInstall;
        settings["inputs"]["useSudo"] = process.env.INPUT_useSudo;
    
        // create settings for inspec
        settings["inputs"]["inspec"] = standard();

        settings["inputs"]["inspec"]["profilePath"] = process.env.INSPEC_PROFILE_PATH;
        settings["inputs"]["inspec"]["resultsFile"] = process.env.INSPEC_RESULTS_FILE;
        settings["inputs"]["inspec"]["arguments"] = process.env.INSPEC_ARGUMENTS;
    
        // get the chef environment name
        if (process.env.chefEnvName != null) {
            settings["inputs"]["chefEnvName"] = process.env.chefEnvName;
        }
    
        if (process.env.chefCookbookName != null) {
            settings["inputs"]["chefCookbookName"] = process.env.chefCookbookName;
        }
    
        if (process.env.chefCookbookVersion != null) {
            settings["inputs"]["chefCookbookVersion"] = process.env.chefCookbookVersion;
        }
    
      } else {
    
        // get teh service endpoint, but only if it has been specified
        if (serviceEndpointName.length > 0) {
    
          try {
            let connected_service = tl.getInput(serviceEndpointName, true);
            tl.debug(sprintf("Endpoint: %s", JSON.stringify(connected_service)));
    
            // only attempt to get the endpoint details if the chefServerEndpoint has been set
            if (connected_service != null) {
    
                if (serviceEndpointName == "tkAzureEndpoint") {

                    // get the SPN information
                    settings["inputs"]["azure_creds"] = {
                        "subscription_id": tl.getEndpointDataParameter(connected_service, "SubscriptionId", true),
                        "tenant_id": tl.getEndpointAuthorizationParameter(connected_service, "tenantid", true),
                        "client_id": tl.getEndpointAuthorizationParameter(connected_service, "serviceprincipalid", true),
                        "client_secret": tl.getEndpointAuthorizationParameter(connected_service, "serviceprincipalkey", true)
                    }

                } else {

                    // get the necessary inputs from the specified endpoint
                    let auth = tl.getEndpointAuthorization(connected_service);

                    // get necessary information from the endpoint
                    settings["inputs"]["chefServiceUrl"] = tl.getEndpointUrl(connected_service);
                    settings["inputs"]["chefUsername"] = auth.parameters.username;
                    settings["inputs"]["chefUserKey"] = auth.parameters.password;

                    // get the value for SSL Verification
                    settings["inputs"]["chefSSLVerify"] = !!+tl.getEndpointDataParameter(connected_service, "sslVerify", true);

                    tl.debug(sprintf("SSL Verify: %s", settings["inputs"]["chefSSLVerify"]));
                }
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
          "inspecArguments": "inspec.arguments",
          "useSudo": "",
          "chefClientLogLevel": "",
          "deletePrivateKey": "",
          "gemVersion": "gem.version",
          "gemForceInstall": "gem.forceInstall",
          "gemName": "gem.name",
          "knifeArguments": "knife.arguments",
          "knifePrivateKey": "knife.privateKey",
          "lintAction": "lint.action",
          "lintActionCommand": "lint.actionCommand",
          "lintActionFolder": "lint.folder",
          "tkKitchenFile": "tk.file",
          "tkKitchenFolder": "tk.folder",
          "gemfileFolder": "gemfile.folder",
          "berksInstallArguments": "berks.installArgs",
          "berksUploadArguments": "berks.uploadArgs"
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
              dot.str(input_fields[input_field], value, settings["inputs"]);
            } else {
              // set the input field value in the inputs array
              settings["inputs"][input_field] = value;
            }
          }
        });
    
        // ensure that defaults have been set if it has not been set in parameters for the task
        if (!("chefInstallScriptDownloadURL" in settings["inputs"])) {
            settings["inputs"]["chefInstallScriptDownloadURL"] = settings["script_url"];
        }
    
        if (!("downloadsFolder" in settings["inputs"])) {
            settings["inputs"]["downloadsFolder"] = settings["paths"]["download"];
        }

        // set the lint action command if it has not been specified
        if ("lint" in settings["inputs"]) {
            if (!("actionCommand" in settings["inputs"]["lint"])) {
                let action = settings["inputs"]["lint"]["action"];
                settings["inputs"]["lint"]["actionCommand"] = settings["linting"]["actions"][action];
            }
        }
      }
    
      // If running in debug mode output the inputs
      tl.debug(sprintf("Task Inputs: %s", JSON.stringify(settings["inputs"])));
    
      return settings;
    }