// Import necessary libraries
import * as program from "commander";
import * as path from "path";
import * as fs from "fs-extra";
import {sprintf} from "sprintf-js";
import * as child from "child_process";

// Import the scripts that execute the command
import * as copylibs from "./copy_libs";
import * as taskdeps from "./taskdeps";
import * as copyfiles from "./copy_files";
import * as version from "./version";
import * as preview from "./preview";
import * as manifest from "./manifests";
import * as lint from "./lint";

function parseBuildConfig(app_root, build_config_file) {
  let build_config = {};
  // Determine if the build_config_file exists
  if (fs.existsSync(build_config_file)) {
    // read in the configuration file so that it can be passed to operations
    build_config = JSON.parse(fs.readFileSync(build_config_file, "utf8"));

    // iterate around the dirs and prepend the app_root if it is not an absolute path
    Object.keys(build_config["dirs"]).forEach(function (key) {
      if (!path.isAbsolute(build_config["dirs"][key])) {
        build_config["dirs"][key] = path.join(app_root, build_config["dirs"][key]);
      };
    });

    // iterate around the extension files and prepend the app_root if the files
    // are not absolute
    let extension_files = build_config["files"]["extension"].map(function(file) {
      if (!path.isAbsolute(file)) {
        file = path.join(app_root, file);
      }
      return file;
    });

    // set the extension files on the build_config
    build_config["files"]["extension"] = extension_files;

  } else {
    console.error("Build configuration file not found: %s", build_config_file);
    process.exit(1);
  }

  return build_config;
}

function compileTasks(options) {
  console.log("Compiling tasks");

  // run the tsc command to compile the tasks
  let cmd = sprintf("%s --project %s", options.parent.tscpath, options.tsconfigfile);
  child.execSync(cmd);
}

function createPackages(options, build_config) {
  console.log("Building package files");

  // initialise varibles
  let cmd = "";
  let root_path = "";

  for (let extension_type of ["preview", "production"]) {
    console.log("  %s", extension_type);
    root_path = path.join(build_config["dirs"]["output"], extension_type);
    cmd = sprintf("%s extension create --root %s --output-path %s --manifests vss-extension.json", options.parent.tfxpath, root_path, build_config["dirs"]["output"]);
    child.execSync(cmd);
  }
}

// Determine the root path for the project
// This assumes that this script is in the scripts directory
let app_root = path.resolve(__dirname, "..");

// Set the default value for the build configuration file
let build_config_file = path.join(app_root, "build.json");

// Set the default value for the tasks directories
let tasks_dir = path.join(app_root, "tasks");

let tfx_path = path.join(app_root, "node_modules", ".bin", "tfx");
let tsc_path = path.join(app_root, "node_modules", ".bin", "tsc");
let tslint_path = path.join(app_root, "node_modules", ".bin", "tslint");

// Set the default build configuration file for the tasks
let tsconfig_file = path.join(tasks_dir, "tsconfig.build.json");
let tslint_config_file = path.join(app_root, "tslint.json");

// configure the command line
program.version("0.0.1")
        .description("VSTS Extension Builder")
        .option("-b, --buildconfig [file]", "Specify the build configuration file to use", build_config_file)
        .option("-t, --tasksdir [directory]", "Path to the tasks folder", tasks_dir)
        .option("--tfxpath [path]", "Path to the TFX executable", tfx_path)
        .option("--tscpath [path]", "Path to the TSC executable", tsc_path)
        .option("--tslintpath [path]", "Path to the TSLint executable", tslint_path);

// Add the necessary sub commands
// Linting
program.command("lint")
       .description("Lint the Typescript files")
       .option("--tslintconfig [path]", "TSLint configuration file", tslint_config_file)
       .action(function (options) {
          lint.files(options);
       });

// Copy Libraries-------------------------------------
program.command("copylibs")
        .description("Copy libraries to extension tasks")
        .action(function (options) {
          copylibs.copy(options, parseBuildConfig(app_root, build_config_file));
        });

// Task Dependecies ----------------------------------
program.command("taskdeps")
       .description("Iterate around the tasks and install dependencies")
       .action(function (options) {
         taskdeps.install(options, parseBuildConfig(app_root, build_config_file));
       });

// Compile Tasks ------------------------------------
program.command("compiletasks")
       .description("Compile the typescript tasks into JavaScript")
       .option("-f, --tsconfigfile [file]", "Path to the configuration file to use for the task compilation", tsconfig_file)
       .action(function (options) {
         compileTasks(options);
       });

// Copy Files ---------------------------------------
// This task copies the necessary image files, extension manifest files etc to the correct location in the
// build directory
program.command("copyfiles")
       .description("Copy static files into the built extension")
       .action(function (options) {
          copyfiles.copy(options, parseBuildConfig(app_root, build_config_file));
       });

// Version ------------------------------------------
// Version the extension and the tasks
program.command("version")
       .description("Version extension and tasks")
       .option("-v, --version [number]", "Version number to be applied to the extension and tasks. This must be a semantic version", process.env.BUILD_BUILDNUMBER)
       .action(function (options) {
         version.set(options, parseBuildConfig(app_root, build_config_file));
       });

// Create preview extension
// Now that the main extension has been built, a copy can be made to create the preview extension
// This will also rename the extension and tasks appropriately so they are different extensions in VSTS
program.command("preview")
       .description("Create the preview extension")
       .action(function (options) {
         // copy the production extension to a preview folder and patch with "preview" extension
         preview.create(options, parseBuildConfig(app_root, build_config_file));
       });

// Manifest task
// This sets the manifest files for the production and preview extensions
program.command("manifest")
       .description("Set the flags on the extensions")
       .action(function () {
         manifest.configure(parseBuildConfig(app_root, build_config_file));
       });

// Package
// Package the extensions
program.command("package")
       .description("Build the package files for each extension")
       .action(function (options) {
         createPackages(options, parseBuildConfig(app_root, build_config_file));
       });

program.command("run")
       .description("Run the entire build process")
       .option("-f, --tsconfigfile [file]", "Path to the configuration file to use for the task compilation", tsconfig_file)
       .option("-v, --version [number]", "Version number to be applied to the extension and tasks. This must be a semantic version", process.env.BUILD_BUILDNUMBER)
       .option("--tslintconfig [path]", "TSLint configuration file", tslint_config_file)
       .action(function (options) {
          let build_config = parseBuildConfig(app_root, build_config_file);
          lint.files(options);
          copylibs.copy(options, build_config);
          taskdeps.install(options, build_config);
          compileTasks(options);
          copyfiles.copy(options, build_config);
          version.set(options, build_config);
          preview.create(options, build_config);
          manifest.configure(build_config);
          createPackages(options, build_config);
       });

// Parse the command line options
program.parse(process.argv);
