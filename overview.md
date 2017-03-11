# Build and Release Tasks for Chef

This extension contains tasks that can modify items on a Chef server using the API.

## Tasks included

* **Update Environment**: Set the cookbook constraint on a specified environment

## Required information

Each of the tasks require the following parameters:

* Chef Server URL - URL to the chef server including the organization
* User ID - Named user on the Chef server that has admin permissions
* User Key - Provate key for the specified user

At the very least it is recommened that the `User Key` is specified as a secret variable in VSTS so that it is not exposed in any logs.  It is highly recommended that the other parameters are also set as variables so that they can be reused and modified easily across all tasks.

### Update Environment

This task requires the following additional information

* Envrionment Name - Name of the environment that will have the cookbook constraint added
* Chef Cookbook Name - Name of the cookbook that will have be constrained
* Chef Cookbook Version - Version of the cookbook to be set

## Contributors

This extension was created by Chef