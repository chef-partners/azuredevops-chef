# Chef Tasks for VSTS

This repo contains tasks for VSTS that allow VSTS to communicated and affect changes using the Chef API.

The following tasks are available:

* **Update Environment**: Sets a cookbook version constraint on the specified environment

## Building

The aim of ths repo is to have multiple tasks from one extension.  However a task is not able to depend on _any_ code or libraries that are not at the same level as the task code.  This means that at build time the relevant files and directories need to be copied.  When performing a build there are build tasks that assist with this.

All output from a build will be placed into the `build` directory.

```bash
npm run build:tasks
npm run package:tasks
```

## Development

Run the following to configure the local environment:

```bash
npm run init:dev
```

When developing it is recommended that Visual Studio Code is used.  There are tasks for VSCode that have been setup to allow for debugging and compliation of TypeScript files.

The following must be configured before attempting to debug:

 - A symlink to the `common` folder _must_ be present in each task.  This is so that a copy of the dependent libraries is built into the `dist` folder at compile time.
 - The `node_modules` from the specific task directory needs to be copied to the relevant output dir in `dist`.  This is so that the JavaScript can find the necessary files.

The VSCode configuration will ensure that all compliations of TypeScript files will be copied into `dist` directory.

Each task has its own `package.json` file that has the dependencies for the task which is why it has to be copied to the output directory,

When a new task is created then the build tasks in the root `package.json` will need be updated, namely the `initdev:npm` and `build:tasks:noclean` tasks.

# NPM Tasks

The following table shows a list of all the NPM tasks that have been created.

| Name | Description |
|------|-------------|
| initdev:npm | Install packages for tasks.  This needs to be ammended for each new task |
| initdev:typngs | Install the typings for tasks (not individual) |
| initdev | Wrapper for above two tasks |
| clean | Remove the `build` directory |
| compile:tasks | Compile the `scripts` that are required during the build.  Compile the tasks as defined by the `tasks/tsconfig.build.json` |
| version | Run the `scripts/version.js` to increment the version of the extension |
| copyfiles | Run `scripts/copyfiles.js` to copy necessary files for extension and tasks |
| build:tasks:noclean | Run above 4 tasks _without_ cleaning |
| build:tasks | Execute the above 5 tasks |
| package:tasks | Create the extension VSIX file from the `build` directory |