
import * as fs from 'fs-extra'
import * as path from 'path'
import * as semver from 'semver'
import * as common from './common'

// define the build path
let build_path = path.join(__dirname, "..", "build", "production");

// Get the build version from the enviornment variable
let build_number = process.env.BUILD_BUILDNUMBER

// read in the vss-extension file so that the version number can be incremented
let extension_file = path.join(build_path, 'vss-extension.json')
let extension = JSON.parse(fs.readFileSync(extension_file, 'utf8'))

// set the version of the extension to the build number
extension.version = build_number

// write out the extension file
fs.writeFileSync(extension_file, JSON.stringify(extension, null, 4))

console.log("Extension version: %s", extension.version)

// retrieve all the tasks
let tasks = common.get_tasks();

// iterate around the tasks
let task_files = tasks.map(function (task_name) {

    // use the name to find the task.json file for the tasks that have been built
    let task_path = path.join(build_path, 'tasks', task_name, 'task.json')

    // read in the file
    let task_config = JSON.parse(fs.readFileSync(task_path, 'utf-8'))

    // set the version number of the task to the same as that of the extension
    task_config.version.Major = semver.major(build_number)
    task_config.version.Minor = semver.minor(build_number)
    task_config.version.Patch = semver.patch(build_number)

    // save the task.json file
    fs.writeFileSync(task_path, JSON.stringify(task_config, null, 4))

    // output information to state the version of the task being set
    console.log("Task '%s' version: %s", task_name, build_number)
})