import * as os from "os";
import * as path from "path";
import * as fs from "fs-extra";

export function settings() {
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
        }
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

            // define where the private key should be written out when using knife
            settings["paths"]["private_key"] = path.join("c:", "windows", "temp", "vsts-task.pem");

            // set where the configuration file for berks should be written to 
            settings["paths"]["berks_config"] = path.join("c:", "windows", "temp", "berks.config.json");

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

            // define where the private key should be written out when using knife
            settings["paths"]["private_key"] = path.join("/", "tmp", "vsts-task.pem");

            // set where the configuration file for berks should be written to 
            settings["paths"]["berks_config"] = path.join("/", "tmp", "berks.config.json");

            // set an array for where chef-client will usually be installed
            // this is so that the one in the ChefDK will be used if it is installed.
            chefclient_paths = [
                path.join("/", "usr", "bin", "chef-client"),
                path.join(settings["paths"]["chefdk"], "bin", "chef-client")
            ];
    }

    // iterate around the chefclient_paths and set the one that exists
    for (let chefclient_path of chefclient_paths) {
        if (fs.existsSync(chefclient_path)) {
            settings["paths"]["chefclient"] = chefclient_path;
            break;
        }
    }

    // return the settings to the calling function
    return settings;
}