/**
 * Perform tests to exercise the installation component of the task
 * on windows
 */

// Import libraries --------------------------------------------------
// - local libs
import { TaskConfiguration } from "../src/common/taskConfiguration";
import { InstallComponents } from "../src/common/installComponents";

// - External task libs
import * as tl from "azure-pipelines-task-lib";
import * as rimraf from "rimraf";

// - Standard libs
import * as os from "os";
import { join as pathJoin } from "path";
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "fs";

// - Test libraries
import { expect } from "chai";
import * as sinon from "sinon";

// -------------------------------------------------------------------

// Configure constants
const WINDOWS = "win32";
const LINUX = "linux";

// Declare properties
let inputs = {};
let tlsetResult;
let getInput;
let tlDebug;
let platform;
let tc: TaskConfiguration;
let ic: InstallComponents;

// create dummy files for testing that the external command works
let windowsInstallerFile_ChefWorkstation = pathJoin(__dirname, "chef-workstation.msi");
let linuxInstallerFile_ChefWorkstation = pathJoin(__dirname, "chef-workstation.deb");

/**
 * Create the files required for the tests.
 * This function will be used in the before and after for the suite
 *
 * @param remove Boolean to state whether the files should be delete. Default: false
 */
function ephemeralFiles(remove) {
  if (remove) {
    console.log("Removing ephemeral files");
    unlinkSync(windowsInstallerFile_ChefWorkstation);
    unlinkSync(linuxInstallerFile_ChefWorkstation);
  } else {
    console.log("Setting up test ephemeral files");
    writeFileSync(windowsInstallerFile_ChefWorkstation, "windows");
    writeFileSync(linuxInstallerFile_ChefWorkstation, "linux");
  }
}

// define a tempdir that the scripts can be written out to
function tempDir(remove: boolean = false): string {

  let path = pathJoin(__dirname, "temp");

  if (remove) {
    rimraf.sync(path);
  } else {
    if (!existsSync(path)) {
      mkdirSync(path);
    }
  }

  return path;
}

describe("Install Components", () => {

  // Setup the hooks for the tests in this suite
  // These will create and remove the external files that are to be used in some of the tests
  before(() => {
    // stub out the getInputs from the azure devops task library
    getInput = sinon.stub(tl, "getInput").callsFake((name) => {
      return inputs[name];
    });

    // stub the debug messages from the tl lib
    tlDebug = sinon.stub(tl, "debug");

    // stub the azdo tasklib setResult function
    tlsetResult = sinon.stub(tl, "setResult");

    // stub out the platform function from the os object
    platform = sinon.stub(os, "platform").callsFake(() => {
      return inputs["platform"];
    });

    ephemeralFiles(false);

    process.env.AGENT_TEMPDIRECTORY = tempDir();
  });

  after(() => {
    ephemeralFiles(true);

    getInput.restore();
    platform.restore();
    tlsetResult.restore();
    tlDebug.restore();

    process.env.AGENT_TEMPDIRECTORY = "";
  });

  describe("Windows", () => {

    // configure the stubs that are to be used in the tests
    before(() => {

      // stub out the platform function from the os object
      inputs = {
        "platform": WINDOWS
      };
    });

    describe("Chef Workstation", () => {

      // configure the inputs to be used
      before(() => {
        inputs["component"] = "chef-workstation";
        inputs["channel"] = "stable";
      });

      describe("Use default install script to download and install component", () => {

        // create the expected parts
        let expected = [
          "powershell.exe",
          "-Command",
          pathJoin(tempDir(false), "install.ps1"),
          ";",
          "Install-Project",
          "-Project",
          "chef-workstation",
          "-Channel",
          "stable"
        ];

        it("should return an array", () => {
          // create the objects that are required
          tc = new TaskConfiguration();
          ic = new InstallComponents(tc);

          tc.getTaskParameters();
          expect(ic.installCmd()).to.be.an("array");
        });

        it("should return the expected command", () => {
          // create the objects that are required
          tc = new TaskConfiguration();
          ic = new InstallComponents(tc);

          tc.getTaskParameters();
          expect(ic.installCmd()).to.eql(expected);
        });
      });

      describe("Use default install script to download specific component and install", () => {

        // update the inputs
        before(() => {
          inputs["version"] = "1.2.3";
        });

        after(() => {
          delete inputs["version"];
        });

        // build up the expected array to install chef workstation
        let expected = [
          "powershell.exe",
          "-Command",
          pathJoin(tempDir(false), "install.ps1"),
          ";",
          "Install-Project",
          "-Project",
          "chef-workstation",
          "-Channel",
          "stable",
          "-Version",
          "1.2.3"
        ];

        it("should return the correct command", () => {
          tc.getTaskParameters();
          expect(ic.installCmd()).to.eql(expected);
        });
  
        it("result should be a array", () => {
          tc.getTaskParameters();
          expect(ic.installCmd()).to.be.an("array");
        });
      });

      describe("Use default install script but install from existing installer file", () => {
        before(() => {
          inputs["targetPath"] = windowsInstallerFile_ChefWorkstation;
        });

        after(() => {
          delete inputs["targetPath"];
        });
  
        // build up the expected array to install chef workstation
        let expected = [
          "powershell.exe",
          "-Command",
          pathJoin(tempDir(false), "install.ps1"),
          ";",
          "Install-Project",
          "-Filename",
          windowsInstallerFile_ChefWorkstation
        ];
  
        it("should return the correct command", () => {
          // simulate inputs to the task
          tc.getTaskParameters();
  
          expect(ic.installCmd()).to.eql(expected);
        });
      });

      describe("Attempt to use the script to install from a specified file that does not exist", () => {
        // define the inputs required
        before(() => {
          inputs["targetPath"] = "dummy_file";
        });

        after(() => {
          delete inputs["targetPath"];
        })
  

        it("should report that the installer file does not exist", () => {
          // simulate inputs to the task
          tc.getTaskParameters();
          let cmd = ic.installCmd();

          // expect(() => { ic.installCmd() }).to.throw("Unable to find installation file:");
          sinon.assert.called(tlsetResult);
        });
      });
    });

    describe("Habitat", () => {

      // configure the inputs to be used
      before(() => {
        inputs["component"] = "habitat";
        inputs["habitatInstallScriptUrl"] = "https://raw.githubusercontent.com/habitat-sh/habitat/master/components/hab/install.sh";
      });

      describe("Use default install script to download and install Habitat", () => {

        // create the expected cmd parts
        let expected = [
          "powershell.exe",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          "Invoke-Expression",
          "-Command",
          "((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/habitat-sh/habitat/master/components/hab/install.ps1'))"
        ];

        it("should return an array", () => {
          // create the objects that are required
          tc = new TaskConfiguration();
          ic = new InstallComponents(tc);

          tc.getTaskParameters();
          expect(ic.installCmd()).to.be.an("array");
        });

        it("should return the expected command", () => {
          // create the objects that are required
          tc = new TaskConfiguration();
          ic = new InstallComponents(tc);

          tc.getTaskParameters();
          expect(ic.installCmd()).to.eql(expected);
        });
      });
    });
  });

  describe("Linux", () => {

    // stub out the platform function from the os object
    before(() => {
      inputs = {
        "platform": LINUX
      };
    });

    describe("Chef Workstation", () => {

      // configure the inputs to be used
      before(() => {
        inputs["component"] = "chef-workstation";
        inputs["channel"] = "stable";
      });

      describe("Use default install script to download and install component", () => {

        // create the expected parts
        let expected = [
          "bash",
          pathJoin(tempDir(false), "install.sh"),
          "-P",
          "chef-workstation",
          "-c",
          "stable"
        ];

        it("should return an array", () => {
          // create the objects that are required
          tc = new TaskConfiguration();
          ic = new InstallComponents(tc);

          tc.getTaskParameters();
          expect(ic.installCmd()).to.be.an("array");
        });

        it("should return the expected command", () => {
          // create the objects that are required
          tc = new TaskConfiguration();
          ic = new InstallComponents(tc);

          tc.getTaskParameters();
          expect(ic.installCmd()).to.eql(expected);
        });
      });

      describe("Use default install script to download specific component and install", () => {

        // update the inputs
        before(() => {
          inputs["version"] = "1.2.3";
        });

        after(() => {
          delete inputs["version"];
        });

        // build up the expected array to install chef workstation
        let expected = [
          "bash",
          pathJoin(tempDir(false), "install.sh"),
          "-P",
          "chef-workstation",
          "-c",
          "stable",
          "-v",
          "1.2.3"
        ];

        it("should return the correct command", () => {
          tc.getTaskParameters();
          expect(ic.installCmd()).to.eql(expected);
        });
  
        it("result should be a array", () => {
          tc.getTaskParameters();
          expect(ic.installCmd()).to.be.an("array");
        });
      });

      describe("Use default install script but install from existing installer file", () => {
        before(() => {
          inputs["targetPath"] = linuxInstallerFile_ChefWorkstation;
        });

        after(() => {
          delete inputs["targetPath"];
        });
  
        // build up the expected array to install chef workstation
        let expected = [
          "bash",
          pathJoin(tempDir(false), "install.sh"),
          "-f",
          linuxInstallerFile_ChefWorkstation
        ];
  
        it("should return the correct command", () => {
          // simulate inputs to the task
          tc.getTaskParameters();
  
          expect(ic.installCmd()).to.eql(expected);
        });
      });

      describe("Attempt to use the script to install from a specified file that does not exist", () => {
        // define the inputs required
        before(() => {
          inputs["targetPath"] = "dummy_file";
        });

        after(() => {
          delete inputs["targetPath"];
        })
  

        it("should report that the installer file does not exist", () => {
          // simulate inputs to the task
          tc.getTaskParameters();
          let cmd = ic.installCmd();

          // expect(() => { ic.installCmd() }).to.throw("Unable to find installation file:");
          sinon.assert.called(tlsetResult);
        });
      });
      
    });

    describe("Habitat", () => {

      // configure the inputs to be used
      before(() => {
        inputs["component"] = "habitat";
        inputs["habitatInstallScriptUrl"] = "https://raw.githubusercontent.com/habitat-sh/habitat/master/components/hab/install.ps1";
      });

      describe("Use default install script to download and install Habitat", () => {

        // create the expected cmd parts
        let expected = [
          "curl",
          "-o",
          "habitat_install.sh",
          "https://raw.githubusercontent.com/habitat-sh/habitat/master/components/hab/install.sh",
          "&&",
          "bash",
          "habitat_install.sh"
        ];

        it("should return an array", () => {
          // create the objects that are required
          tc = new TaskConfiguration();
          ic = new InstallComponents(tc);

          tc.getTaskParameters();
          expect(ic.installCmd()).to.be.an("array");
        });

        it("should return the expected command", () => {
          // create the objects that are required
          tc = new TaskConfiguration();
          ic = new InstallComponents(tc);

          tc.getTaskParameters();
          expect(ic.installCmd()).to.eql(expected);
        });
      });
    });
  });

});

