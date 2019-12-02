/**
 * Perform test to make sure that the installation script is written out correctly
 */

// Import libraries --------------------------------------------------
// - local libs
import { TaskConfiguration } from "../src/common/taskConfiguration";
import { InstallComponents } from "../src/common/installComponents";
import { Scripts } from "../src/common/scripts";

// - External task libs
import * as tl from "azure-pipelines-task-lib";
import * as rimraf from "rimraf";

// - Standard libs
import { join as pathJoin } from "path";
import { mkdirSync, existsSync } from "fs";

// - Test libraries
import { expect } from "chai";
import * as sinon from "sinon";
import * as os from "os";


// -------------------------------------------------------------------

// Configure constants
const WINDOWS = "win32";
const LINUX = "linux";

// Declare properties
let inputs = {};
let platform;
let tlsetResult;
let getInput;
let tc: TaskConfiguration;
let ic: InstallComponents;
let scripts: Scripts;

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

describe("Write Script", () => {

  before(() => {

    // stub out the getInputs from the azure devops task library
    getInput = sinon.stub(tl, "getInput").callsFake((name) => {
      return inputs[name];
    });
  
    // stub out the platform function from the os object
    platform = sinon.stub(os, "platform").callsFake(() => {
      return inputs["platform"];
    });
  
    // stub the azdo tasklib setResult function
    tlsetResult = sinon.stub(tl, "setResult");

    process.env.AGENT_TEMPDIRECTORY = tempDir();
  });

  after(() => {
    getInput.restore();
    platform.restore();
    tlsetResult.restore();

    process.env.AGENT_TEMPDIRECTORY = "";
  });

  describe("Windows", () => {

    // Configure the platform being used and instantaiate the class
    before(() => {

      // set the platform to windows
      inputs = {
        "platform": WINDOWS
      };
    });

    it("PowerShell script is written out", () => {
      tc = new TaskConfiguration();
      ic = new InstallComponents(tc);
      scripts = new Scripts();
      tc.getTaskParameters();

      ic.WriteScript();
      expect(existsSync(tc.Paths.Script)).to.be.true;

      // the script should verify
      expect(scripts.VerifyScript(true, tc.Paths.Script)).to.be.true;
    });

  });

  describe("Linux", () => {

    // Configure the platform being used and instantaiate the class
    before(() => {

      // set the platform to windows
      inputs = {
        "platform": LINUX
      };
    });

    it("Bash script is written out", () => {
      tc = new TaskConfiguration();
      ic = new InstallComponents(tc);
      scripts = new Scripts();
      tc.getTaskParameters();

      ic.WriteScript();
      expect(existsSync(tc.Paths.Script)).to.be.true;

      // the script should verify
      expect(scripts.VerifyScript(false, tc.Paths.Script)).to.be.true;
    });

  });  

});