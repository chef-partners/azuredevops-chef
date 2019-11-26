// Import necessary libraries
import { TaskConfiguration } from "../src/common/taskConfiguration";
import { expect } from "chai";
import { join as pathJoin } from "path";
import { InstallComponents } from "../src/common/installComponents";
import { writeFileSync, unlinkSync } from "fs-extra";
import { OperationCanceledException } from "typescript";

// create dummy files for testing that the external command works
let windowsInstallerFile_ChefWorkstation = pathJoin(__dirname, "chef-workstation.msi");
let linuxInstallerFile_ChefWorkstation = pathJoin(__dirname, "chef-workstation.deb");

let tc: TaskConfiguration;
let ic: InstallComponents;

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

describe("Install Components", () => {

  // Setup the hooks for the tests in this suite
  // These will create and remove the external files that are to be used in some of the tests
  before(() => {
    ephemeralFiles(false);
  });

  after(() => {
    ephemeralFiles(true);
  });

  describe("Windows", () => {

    // use the before hook to setup the tc object
    before(() => {
      tc = new TaskConfiguration(__dirname, "win32");
      ic = new InstallComponents(tc);
    });

    describe("Installation considerations", () => {

      // test that the installation will occur if not installed
      describe("If component is not installed", () => {
        it("should install", () => {
          expect(ic.shouldInstall()).to.eq(true);
        });
      });

      describe("If component is installed", () => {

        before(() => {
          process.env.INSTALLED = "true";
        });

        after(() => {
          process.env.INSTALLED = "";
        });

        it("should not install", () => {
          expect(ic.shouldInstall()).to.eq(false);
        });
      });



    });

    describe("Chef Workstation", () => {

      // use the before hook in this suite to configure the environment variables
      // to simulate the inputs on the task
      before(() => {
        process.env.COMPONENT = "chef-workstation";
        process.env.CHANNEL = "stable";
      });

      describe("Script install with download", () => {
        // build up the expected array to install chef workstation
        let expected = [
          "powershell.exe",
          "-Command",
          pathJoin(__dirname, "scripts", "install.ps1"),
          ";",
          "Install-Project",
          "-Project",
          "chef-workstation",
          "-Channel",
          "stable"
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

      describe("Script install specific version with download", () => {

        // set the version that is to be installed
        before(() => {
          process.env.VERSION = "1.2.3";
        });

        after(() => {
          process.env.VERSION = "";
        });

        // build up the expected array to install chef workstation
        let expected = [
          "powershell.exe",
          "-Command",
          pathJoin(__dirname, "scripts", "install.ps1"),
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

      describe("Install from existing installer on disk", () => {

        // define the inputs required
        before(() => {
          process.env.TARGETPATH = windowsInstallerFile_ChefWorkstation;
        });

        after(() => {
          process.env.TARGETPATH = "";
        });
  
        // build up the expected array to install chef workstation
        let expected = [
          "powershell.exe",
          "-Command",
          pathJoin(__dirname, "scripts", "install.ps1"),
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

      describe("Install from file on disk that does not exist", () => {

        // define the inputs required
        before(() => {
          process.env.TARGETPATH = "dummy_file";
        });

        after(() => {
          process.env.TARGETPATH = "";
        })
  
        it("should throw an error", () => {
          // simulate inputs to the task
          tc.getTaskParameters();
  
          expect(() => { ic.installCmd() }).to.throw("Unable to find installation file:");
        });
      });
    });
  });

  describe("Linux", () => {

    // use the before hook to setup the tc object
    before(() => {
      tc = new TaskConfiguration(__dirname, "linux");
      ic = new InstallComponents(tc);
    });

    describe("Chef Workstation", () => {

      // use the before hook in this suite to configure the environment variables
      // to simulate the inputs on the task
      before(() => {
        process.env.COMPONENT = "chef-workstation";
        process.env.CHANNEL = "stable";
      });

      describe("Script install with download", () => {
        // build up the expected array to install chef workstation
        let expected = [
          "bash",
          pathJoin(__dirname, "scripts", "install.sh"),
          "-p",
          "chef-workstation",
          "-c",
          "stable"
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

      describe("Script install specific version with download", () => {

        // set the version that is to be installed
        before(() => {
          process.env.VERSION = "1.2.3";
        });

        after(() => {
          process.env.VERSION = "";
        });

        // build up the expected array to install chef workstation
        let expected = [
          "bash",
          pathJoin(__dirname, "scripts", "install.sh"),
          "-p",
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

      describe("Install from existing installer on disk", () => {

        // define the inputs required
        before(() => {
          process.env.TARGETPATH = linuxInstallerFile_ChefWorkstation;
        });

        after(() => {
          process.env.TARGETPATH = "";
        });
  
        // build up the expected array to install chef workstation
        let expected = [
          "bash",
          pathJoin(__dirname, "scripts", "install.sh"),
          "-f",
          linuxInstallerFile_ChefWorkstation
        ];
  
        it("should return the correct command", () => {
          // simulate inputs to the task
          tc.getTaskParameters();
  
          expect(ic.installCmd()).to.eql(expected);
        });
      });
    });
  });  
});

describe("Installing Ruby Gems within Chef", () => {

  describe("password - it should check for installation", () => {

    // set up the inputs for the gem to install
    before(() => {
      process.env.COMPONENT = "gem";
      process.env.GEMNAME = "password";
    });

    after(() => {
      process.env.COMPONENT = "";
      process.env.GEMNAME = "";
    });

    let expected = [
      "gem",
      "list",
      "-i",
      "password"
    ];

    it("should return the correct command to check for installation", () => {
      tc.getTaskParameters();

      expect(ic.isGemInstalledCmd()).to.eql(expected);
    });
  });

  describe("password - latest", () => {

    // set up the inputs for the gem to install
    before(() => {
      process.env.COMPONENT = "gem";
      process.env.GEMNAME = "password";
    });

    after(() => {
      process.env.COMPONENT = "";
      process.env.GEMNAME = "";
    });

    let expected = [
      "chef",
      "gem",
      "install",
      "password"
    ];

    it("should return the correct command", () => {
      tc.getTaskParameters();
  
      expect(ic.installCmd()).to.eql(expected);
    });

  });

  describe("password - specific version", () => {

    // set up the inputs for the gem to install
    before(() => {
      process.env.COMPONENT = "gem";
      process.env.GEMNAME = "password";
      process.env.VERSION = "1.2.3";
    });

    after(() => {
      process.env.COMPONENT = "";
      process.env.GEMNAME = "";
      process.env.VERSION = "";
    });

    let expected = [
      "chef",
      "gem",
      "install",
      "password",
      "--version",
      "1.2.3"
    ];

    it("should return the correct command", () => {
      tc.getTaskParameters();
  
      expect(ic.installCmd()).to.eql(expected);
    });

  });  

});