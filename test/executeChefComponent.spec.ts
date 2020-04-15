/**
 * Perform tests to exercise the execute task of the extension
 */

// Import libraries ---------------------------------------------------------------
// - local libs
import { TaskConfiguration } from "../src/common/taskConfiguration";
import { ExecuteComponent } from "../src/common/executeComponent";

// - External libs
import * as tl from "azure-pipelines-task-lib";
import * as rimraf from "rimraf";

// - Standard libs
import { join as pathJoin } from "path";
import { mkdirSync, existsSync } from "fs";

// - test libraries
import { expect } from "chai";
import * as sinon from "sinon";
import * as os from "os";

// --------------------------------------------------------------------------------

// Configure constants
const WINDOWS = "win32";
const LINUX = "linux";

// Declare properties
let inputs = {};
let getInput;
let platform;
let tc: TaskConfiguration;
let ex: ExecuteComponent;

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

describe("Execute Components", () => {

  // Setup the mocks and other settings that are required before each test
  before(() => {
    // stub out the getInputs from the AzDo taskl library
    getInput = sinon.stub(tl, "getInput").callsFake((name) => {
      return inputs[name];
    });

    // stub out the platform function from the os object
    platform = sinon.stub(os, "platform").callsFake(() => {
      return inputs["platform"];
    });

    process.env.AGENT_TEMPDIRECTORY = tempDir();
  });

  after(() => {
    getInput.restore();
    platform.restore();
    process.env.AGENT_TEMPDIRECTORY = "";
  });

  describe("Windows", () => {

    // set the platform that is being tests
    before(() => {
      inputs = {
        "platform": WINDOWS
      };
    });

    describe("Chef Client", () => {

      // configure the inputs to be used
      before(() => {
        inputs["component"] = "chef-client";
        inputs["arguments"] = "-c c:/chef/test-client.rb";
      });

      describe("Specify configuration file to use", () => {

        let expected = [
          pathJoin("C:", "opscode", "chef-workstation", "bin", "chef-client.bat"),
          "-c c:/chef/test-client.rb"
        ];

        it("should return the expected command", () => {
          // create the necessary objects
          tc = new TaskConfiguration();
          ex = new ExecuteComponent(tc);

          tc.getTaskParameters();

          let actual = ex.generateCmd();
 
          expect(actual).to.eql(expected);
        });

      });

    });
  });

  

});