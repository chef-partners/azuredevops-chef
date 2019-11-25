/**
 * Script file to correctly version the tasks in the extension
 *
 * The script will patch all the 'task.json' files in the build directory
 * with the specified build number
 */

// import necessary libraries
import * as program from "commander";
import { readFileSync, writeFileSync } from "fs";
import * as glob from "glob";
import { platform } from "os";
import { join as pathJoin, resolve } from "path";
import { sprintf } from "sprintf-js";
import * as semver from "semver";
import * as uuid from "uuidv5";

// Define variables to be used in the script
let projectRoot = resolve(__dirname, "..");
let buildDir = pathJoin(projectRoot, "build");

/**
 * Gets all of the task.json files in the build directory so that the
 * version number in the file can be patched
 * 
 * @param buildDir Path to the build dir. If not set then a default value will be used
 */
function getConfigFiles(pattern: string, debug: boolean) {

  // set the pattern to use to search for files
  let options = {
    debug: debug
  };

  let files = glob.sync(pattern, options);

  return files;
}

/**
 * Perform the versioning of the task files
 * 
 * @param options The command line options that have been passed
 */
function patchFiles(options) {

  // get all the task files
  console.log("Finding task configuration files in dir: %s", options.builddir);
  let configFiles = getConfigFiles(
    pathJoin(options.builddir, "**", "task.json"),
    options.debug
  );

  // determine the preview path
  let previewPath = pathJoin(options.builddir, "preview");

  // if running on Windows the path separators need to be changed
  if (platform() === "win32") {
    previewPath = previewPath.replace(/\\/g, "/");
  }

  // Create UUID namespace
  // This is so that new namespaces can be generated for the preview
  // so that they are "unique" but are always generated the same
  let namespace = uuid("null", "adf05293-f347-46a2-b0a2-dca7863604b0", true);

  for (let file of configFiles) {
    
    console.log("Setting version on: %s", file);

    // using the semver of the build number set the build number on the task
    // read in the file as a JSON object
    let taskConfig = JSON.parse(readFileSync(file, "utf-8"));

    // set the major, minor and revision version numbers
    taskConfig.version.Major = semver.major(options.buildnumber);
    taskConfig.version.Minor = semver.minor(options.buildnumber);
    taskConfig.version.Patch = semver.patch(options.buildnumber);

    // if the task is in the preview folder then patch it accordingly
    // this is the name and title of the task as well as a new UUID number
    if (file.indexOf(previewPath) > -1) {

      console.log("\tPatching preview task");

      // set the name
      taskConfig.name = sprintf("%s-preview", taskConfig.name);

      // set the friendlyName
      taskConfig.friendlyName = sprintf("%s - PREVIEW", taskConfig.friendlyName);

      // set the id
      taskConfig.id = uuid(namespace, taskConfig.name);
    }

    // save the file with the modifications
    writeFileSync(file, JSON.stringify(taskConfig, null, 4));
  }

  // add the version number to the tfx build override files
  let overrideFiles = getConfigFiles(
    pathJoin(options.builddir, "conf", "*.json"),
    options.debug
  );

  console.log("Setting version in override files");
  for (let file of overrideFiles) {
    console.log("\t%s", file);

    let override = JSON.parse(readFileSync(file, "utf-8"));
    Object.assign(override, {"version": options.buildnumber});


    writeFileSync(file, JSON.stringify(override, null, 4));
  }
}

// configure the command line
program.version("2.0.1")
        .description("Patch tasks with version and preview tags")
        .option("-d, --builddir [dir]", "Path to the build directory", buildDir)
        .option("-n, --buildnumber [x.x.x]", "Semantic version number to apply to the the tasks", process.env.BUILD_BUILDNUMBER)
        .option("--debug", "State whether the script should run in debug mode", false)
        .action((options) => {
          patchFiles(options);
        });

// Parse the command line options and run the script
program.parse(process.argv);