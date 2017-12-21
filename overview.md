This [Chef](http://chef.io) integration for Visual Studio Team Services provides a set of tasks to automate commonly performed build and release activities when using the **[Chef Automate](https://www.chef.io/automate/)** platform.  Use these tasks to configure your servers ready for application deployment.

[Chef Automate](https://www.chef.io/automate/) provides a full suite of enterprise capabilities for workflow, visibility and compliance. Chef Automate integrates with the open-source products Chef, InSpec and Habitat.  You can create your own **Chef Automate** server by launching one from the [Azure Marketplace](https://azuremarketplace.microsoft.com/en-us/marketplace/apps/chef-software.chef-automate?tab=Overview).

These tasks are compatible with Chef Server 12.1 and higher.

## Build Tasks

These tasks are typically used in your Build process:

* **Update cookbook version number**: Update a cookbook version to the current build number
* **Upload cookbook to Chef Server**: Upload a cookbook to Chef Server including dependencies
* **Install ChefDK**: Install ChefDK on the build agent

## Utility Tasks

* **Install Gem**: Install a Gem into the ChefDK context. Usually used to install `knife` plugins.
* **Execute Knife**: Execute Knife command with specified arguments.

## Release Tasks

These tasks are typically used as part of your Release process:

* **Add variables to Chef Environment**: Add the VSTS/TFS variables for this environment to the Chef environment
* **Release cookbook version to environment**: Releases a cookbook by releasing the cookbook constraint on the specified Chef environment
* **Install InSpec**: Install InSpec on machines in a Deployment Group
* **Execute InSpec**: Execute InSpec on machines in a Deployment Group
* **Execute Chef Client**: Execute Chef Client on machines in a Deployment Group
* **Publish Cookbook to Supermarket**: Publish the specified cookbook to the Public or a private Chef Supermarket.

## Agent Compatiblity

The following table shows the tasks and what type of agents they are compatibile with. Most of the tasks now work on Windows based agents.

| Task | Private Windows Agent | Private Linux Agent | Hosted Windows Agent | Hosted Linux Agent |
|------|-----------------------|---------------------|----------------------|--------------------|
| Update Cookbook Version Number | Yes | Yes | Yes | Yes |
| Upload Cookbook to Chef Server | Yes | Yes | Yes | Yes |
| Install ChefDK | Yes | Yes | No | Yes |
| Install Gem | Yes | Yes | Yes | Yes |
| Execute Knife | Yes | Yes | Yes | Yes |
| Add Variables to Chef Environment | Yes | Yes | Yes | Yes |
| Release cookbook version to environment | Yes | Yes | Yes | Yes |
| Install InSpec | Yes | Yes | No | Yes |
| Excute InSpec | Yes | Yes | Yes | Yes |
| Execute Chef Client | Yes | Yes | Yes | Yes |
| Publish Cookbook to Supermarket | Yes | Yes | Yes | Yes |

**Note: ** To install ChefDK or InSpec on a Private Linux Agent then task process must be running as root or under an account that has passwordless sudo access. For a Private Windows Agent the process must be running with elevated privileges.

## Getting Started

See our guide to [Getting Started](https://github.com/chef-partners/vsts-chef/wiki/Getting-Started)

## Project Configuration/Endpoint

Before you add any Build or Release tasks to your process, you will need to configure your Chef Server "endpoint". There are 2 endpoints, one for uploading to a Chef server and the other for publishing to a Chef Supermarket.

Both of them have the same options, but allow different credentials to be used for each action.

Endpoints are a per-project configuration and can be accessed via **Project Settings** (cog) > **Services**

The Chef Server endpoint let's you securely store the following information:

* Chef Server URL - URL to the Chef Server including the organization, e.g. `https://mychefserver.westus.cloudapp.azure.com/organizations/myorg`
* Username (Node name) - A username on the Chef server that has admin permissions
* Client key - The private key (in pem format) for the specified user
* SSL Verification - Enables/disables the SSL certificate verification for the Chef Server.  Set to `false` if you are using self-signed certificates.  Default: `true` (Chef Server certificate must be signed by a valid Certificate Authority)

## Documentation and help

For details on installation, please read the [installation guide](https://github.com/chef-partners/vsts-chef/wiki).

For detailed task documentation, please read the [task documentation](https://github.com/chef-partners/vsts-chef/wiki).

To report an issue, please check our [issues list](https://github.com/chef-partners/vsts-chef/issues).

## Contributors

This extension was created by Chef Software, Inc.

To get in contact, please email [partnereng@chef.io](partnereng@chef.io)
