/**
 * Test to check that the shouldInstall function of the installComponents method
 * returns the correct boolean value in different scenarios
 */

// Import libraries --------------------------------------------------
// - local libs
import { TaskConfiguration } from "../src/common/taskConfiguration";
import { InstallComponents } from "../src/common/installComponents";

// - External task libs
import * as tl from "azure-pipelines-task-lib";

// - Standard libs
import * as os from "os";

// - Test libraries
import { expect } from "chai";
import * as sinon from "sinon";

// -------------------------------------------------------------------

// Configure constants
const WINDOWS = "win32";
const LINUX = "linux";

// Declare properties
let stub_isInstalled;
let stub_isSudoInstalled;
let stub_tlDebug;
let stub_tlsetResult;
let stub_getInput;
let stub_platform;


let tc: TaskConfiguration;
let ic: InstallComponents;

describe("Check environment for installation", () => {

  let inputs = {};

  before(() => {
    // stub the debug messages from the tl lib
    stub_tlDebug = sinon.stub(tl, "debug");

    // stub out the platform function from the os object
    stub_platform = sinon.stub(os, "platform").callsFake(() => {
      return inputs["platform"];
    });

    // stub out the getInputs from the azure devops task library
    stub_getInput = sinon.stub(tl, "getInput").callsFake((name) => {
      return inputs[name];
    });

    stub_tlsetResult = sinon.stub(tl, "setResult");

  });

  after(() => {
    sinon.restore();
  });

  describe("Windows", () => {

    before(() => {
      inputs["platform"] = WINDOWS;
    });

    after(() => {
      inputs = {};
    });

    describe("not admin, not installed, no force", () => {

      before(() => {
        inputs["forceInstall"] = false;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = false;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return false;
        });
      });

      afterEach(() => {
        stub_isInstalled.restore();
      });

      it("detects platform as Windows", () => {
        expect(tc.IsWindows).to.eq(true);
      });

      it("is not running as admin", () => {
        expect(tc.runningAsRoot).to.eq(false);
      });

      it("forceInstall is not set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(false);
      });

      it("should not install", () => {
        expect(ic.shouldInstall()).to.eq(false);
      });

    });

    describe("is admin, not installed, no force", () => {
      before(() => {
        inputs["forceInstall"] = false;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = true;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return false;
        });
      });

      afterEach(() => {
        stub_isInstalled.restore();
      });

      it("detects platform as Windows", () => {
        expect(tc.IsWindows).to.eq(true);
      });

      it("is running as admin", () => {
        expect(tc.runningAsRoot).to.eq(true);
      });

      it("forceInstall is not set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(false);
      });

      it("should install", () => {
        expect(ic.shouldInstall()).to.eq(true);
      });
    });

    describe("is admin, is installed, no force", () => {

      before(() => {
        inputs["forceInstall"] = false;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = true;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return true;
        });
      });

      afterEach(() => {
        stub_isInstalled.restore();
      });
  
      it("detects platform as Windows", () => {
        expect(tc.IsWindows).to.eq(true);
      });

      it("is running as admin", () => {
        expect(tc.runningAsRoot).to.eq(true);
      });

      it("forceInstall is not set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(false);
      });

      it("should not install", () => {
        expect(ic.shouldInstall()).to.eq(false);
      });

    });

    describe("is admin, is installed, forced", () => {

      before(() => {
        inputs["forceInstall"] = true;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = true;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return true;
        });
      });

      afterEach(() => {
        stub_isInstalled.restore();
      });
  
      it("detects platform as Windows", () => {
        expect(tc.IsWindows).to.eq(true);
      });

      it("is running as admin", () => {
        expect(tc.runningAsRoot).to.eq(true);
      });

      it("forceInstall is set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(true);
      });

      it("should install", () => {
        expect(ic.shouldInstall()).to.eq(true);
      });
    });
 
  });


  describe("Linux", () => {

    before(() => {
      inputs["platform"] = LINUX;
    });

    after(() => {
      inputs = {};
    });

    describe("not root, no sudo, not installed, no force", () => {

      before(() => {
        inputs["forceInstall"] = false;
        inputs["sudo"] = false;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = false;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return false;
        });
      });

      afterEach(() => {
        stub_isInstalled.restore();
      });

      it("detects platform is NOT Windows", () => {
        expect(tc.IsWindows).to.eq(false);
      });

      it("is not running as root", () => {
        expect(tc.runningAsRoot).to.eq(false);
      });

      it("is not using Sudo", () => {
        expect(tc.Inputs.UseSudo).to.eq(false);
      });

      it("forceInstall is not set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(false);
      });      

      it("should not install", () => {
        let result = ic.shouldInstall();
        expect(result).to.eq(false);
      });

    });

    describe("is root, no sudo, not installed, no force", () => {
      before(() => {
        inputs["forceInstall"] = false;
        inputs["sudo"] = false;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = true;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return false;
        });
      });

      afterEach(() => {
        stub_isInstalled.restore();
      });

      it("detects platform is NOT Windows", () => {
        expect(tc.IsWindows).to.eq(false);
      });

      it("is running as root", () => {
        expect(tc.runningAsRoot).to.eq(true);
      });

      it("is not using Sudo", () => {
        expect(tc.Inputs.UseSudo).to.eq(false);
      });      

      it("forceInstall is not set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(false);
      });     

      it("should install", () => {
        expect(ic.shouldInstall()).to.eq(true);
      });
    });

    describe("not root, is sudo, not installed, no force", () => {
      before(() => {
        inputs["forceInstall"] = false;
        inputs["sudo"] = true;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = false;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return false;
        });

        stub_isSudoInstalled = sinon.stub(ic.utils, "IsSudoInstalled").callsFake(() => {
          return true;
        });

      });

      afterEach(() => {
        stub_isInstalled.restore();
        stub_isSudoInstalled.restore();
      });

      it("detects platform is NOT Windows", () => {
        expect(tc.IsWindows).to.eq(false);
      });

      it("is not running as root", () => {
        expect(tc.runningAsRoot).to.eq(false);
      });

      it("is using Sudo", () => {
        expect(tc.Inputs.UseSudo).to.eq(true);
      });      

      it("forceInstall is not set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(false);
      });     

      it("should install", () => {
        expect(ic.shouldInstall()).to.eq(true);
      });
    });    
    
    describe("is root, is sudo, not installed, no force", () => {
      before(() => {
        inputs["forceInstall"] = false;
        inputs["sudo"] = true;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = true;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return false;
        });
      });

      afterEach(() => {
        stub_isInstalled.restore();
      });

      it("detects platform is NOT Windows", () => {
        expect(tc.IsWindows).to.eq(false);
      });

      it("is running as root", () => {
        expect(tc.runningAsRoot).to.eq(true);
      });

      it("it is using Sudo", () => {
        expect(tc.Inputs.UseSudo).to.eq(true);
      });      

      it("forceInstall is not set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(false);
      });  

      it("should install", () => {
        expect(ic.shouldInstall()).to.eq(true);
      });
    });

    describe("is root, is sudo, is installed, no force", () => {
      before(() => {
        inputs["forceInstall"] = false;
        inputs["sudo"] = true;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = true;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return true;
        });
      });

      afterEach(() => {
        stub_isInstalled.restore();
      });

      it("detects platform is NOT Windows", () => {
        expect(tc.IsWindows).to.eq(false);
      });

      it("is running as root", () => {
        expect(tc.runningAsRoot).to.eq(true);
      });

      it("it is using Sudo", () => {
        expect(tc.Inputs.UseSudo).to.eq(true);
      });      

      it("forceInstall is not set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(false);
      });  

      it("should not install", () => {
        expect(ic.shouldInstall()).to.eq(false);
      });
    });

    describe("is root, is sudo, is installed, is forced", () => {
      before(() => {
        inputs["forceInstall"] = true;
        inputs["sudo"] = true;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = true;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return true;
        });
      });

      afterEach(() => {
        stub_isInstalled.restore();
      });

      it("detects platform is NOT Windows", () => {
        expect(tc.IsWindows).to.eq(false);
      });

      it("is running as root", () => {
        expect(tc.runningAsRoot).to.eq(true);
      });

      it("it is using Sudo", () => {
        expect(tc.Inputs.UseSudo).to.eq(true);
      });      

      it("forceInstall is set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(true);
      });  

      it("should not install", () => {
        expect(ic.shouldInstall()).to.eq(true);
      });
    });

    describe("not root, not sudo, is installed, no force", () => {
      before(() => {
        inputs["forceInstall"] = false;
        inputs["sudo"] = false;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = false;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return true;
        });
      });

      afterEach(() => {
        stub_isInstalled.restore();
      });

      it("detects platform is NOT Windows", () => {
        expect(tc.IsWindows).to.eq(false);
      });

      it("is running as root", () => {
        expect(tc.runningAsRoot).to.eq(false);
      });

      it("it is using Sudo", () => {
        expect(tc.Inputs.UseSudo).to.eq(false);
      });      

      it("forceInstall is not set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(false);
      });  

      it("should not install", () => {
        expect(ic.shouldInstall()).to.eq(false);
      });
    });    

    describe("not root, not sudo, is installed, is forced", () => {
      before(() => {
        inputs["forceInstall"] = true;
        inputs["sudo"] = false;
      });

      beforeEach(() => {
        tc = new TaskConfiguration();
        ic = new InstallComponents(tc);
  
        tc.getTaskParameters();
        tc.runningAsRoot = false;

        // create some stubs so that the method can be tests
        stub_isInstalled = sinon.stub(ic, "isInstalled").callsFake(() => {
          return true;
        });
      });

      afterEach(() => {
        stub_isInstalled.restore();
      });

      it("detects platform is NOT Windows", () => {
        expect(tc.IsWindows).to.eq(false);
      });

      it("is running as root", () => {
        expect(tc.runningAsRoot).to.eq(false);
      });

      it("it is using Sudo", () => {
        expect(tc.Inputs.UseSudo).to.eq(false);
      });      

      it("forceInstall is set", () => {
        expect(tc.Inputs.ForceInstall).to.eq(true);
      });  

      it("should not install", () => {
        expect(ic.shouldInstall()).to.eq(false);
      });
    });    

  });
  

});