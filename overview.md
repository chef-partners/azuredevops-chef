# Build and Release Tasks for Chef

This extension contains tasks that can modify items on a Chef server using the API.

## Tasks included

* **Update Environment**: Set the cookbook constraint on a specified environment
* **Upload Cookbook**: Upload the cookbook to the specified Chef server
* **Cookbook Version**: Set the cookbook version to the build number

## Required information

An endpoint called 'Chef Server Connection' is bundled with this extension.  This allows multiple Chef servers to be configured and reused when required.

The endpoint securely contains the following information:

* Chef Server URL - URL to the chef server including the organization
* User ID - Named user on the Chef server that has admin permissions
* User Key - Provate key for the specified user

### Update Environment

This task requires the following information

* Chef Server Endpoint - the configured endpoint to use for contacting the Chef Server
* Envrionment Name - Name of the environment that will have the cookbook constraint added
* Chef Cookbook Name - Name of the cookbook that will have be constrained
* Chef Cookbook Version - Version of the cookbook to be set

## Upload Cookbook

This task requires the following information

* Chef Server Endpoint - the configured endpoint to use for contacting the Chef Server

The following information is optional

* Chef SSL Verifcation Mode - if using self-signed certificates on the Chef server then uncheck this option

## Cookbook Version

There are no inputs associated with this task as it will take the Build Number as the version for the cookbook.

However the BuildNumber **must** be set as a semantic version in the configuration of VSTS.

## Contributors

This extension was created by Chef