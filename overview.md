# Build and Release Tasks for Chef

This extension contains tasks that can modify items on a Chef server using the API.

## Tasks included

### Build Tasks

* **Upload cookbook to Chef Server**: Upload the cookbook to the specified Chef server
* **Update cookbook version number**: Set the cookbook version to the build number

### Release Tasks

* **Release cookbook version to environment**: Set the cookbook constraint on the specified Chef environment
* **Add VSTS Variables to Chef Environment**: Adds VSTS release environment variables as attributes on the Chef Environment


## Required information

An endpoint called 'Chef Server' is bundled with this extension.  This allows multiple Chef servers to be configured and reused when required.

The endpoint securely contains the following information:

* Chef Server URL - URL to the chef server including the organization
* User ID - Named user on the Chef server that has admin permissions
* User Key - Private key for the specified user

## Upload cookbook to Chef Server

This task requires the following information

* Chef Server Endpoint - the configured endpoint to use for contacting the Chef Server
* SSL Verification - by default this is enabled, but can be disabled if your Chef Server is using self signed certificates.

## Update cookbook version number

There are no inputs associated with this task as it will take the Build Number as the version for the cookbook.

However the BuildNumber **must** be set as a semantic version in the configuration of VSTS.

This is set in the "Options" of the build.  An example format would be `1.0.$(BuildID)` which would ensure that it is a semantic version and it increments each time.  The major and minor versions would then be updated as required for the build.

### Release cookbook version to environment

This task requires the following information

* Chef Server Endpoint - the configured endpoint to use for contacting the Chef Server
* Environment Name - Name of the environment that will have the cookbook constraint added
* Chef Cookbook Name - Name of the cookbook that will have be constrained
* Chef Cookbook Version - Version of the cookbook to be set

## Release cookbook version to environment

This task requires the following information

* Chef Server Endpoint - the configured endpoint to use for contacting the Chef Server
* Chef Cookbook Path - the path to the cookbook to upload within the sources that have been checked out
    - It is assumed that the cookbook will be in `$(Build.SourcesDirectory)\cookbooks` and this is added as a helper, however the name of the cookbook _must_ be set, unless it is the only thing in the specified directory.
    - Do not use `/` as a path to the cookbook.  If it is in the root of the sources then leave as `$(Build.SourcesDirectory)`

The following information is optional

* Chef SSL Verification Mode - if using self-signed certificates on the Chef server then uncheck this option



## Contributors

This extension was created by Chef