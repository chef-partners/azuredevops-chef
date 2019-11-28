/**
 * Perform tests to ensure that ruby gems are installed correctly
 */

// Import libraries --------------------------------------------------
// - local libs
import { TaskConfiguration } from "../src/common/taskConfiguration";
import { InstallComponents } from "../src/common/installComponents";

// - External task libs
import * as tl from "azure-pipelines-task-lib";

// - Standard libs
import * as os from "os";
import { join as pathJoin } from "path";
import { writeFileSync, unlinkSync } from "fs";

// - Test libraries
import { expect } from "chai";
import * as sinon from "sinon";

// -------------------------------------------------------------------

// Declare properties
let inputs = {};
let getInput;
let tlDebug;
let tc: TaskConfiguration;
let ic: InstallComponents;

describe("Installing Ruby Gems within Chef", () => {

  before(() => {

    // stub out the getInputs from the azure devops task library
    getInput = sinon.stub(tl, "getInput").callsFake((name) => {
      return inputs[name];
    });

    // stub the debug messages from the tl lib
    tlDebug = sinon.stub(tl, "debug");

    inputs = {
      "component": "gem",
      "gemName": "password"
    };
  });

  after(() => {
    inputs = {};

    getInput.restore();
    tlDebug.restore();
  });

  describe("password - it should check for installation", () => {

    let expected = [
      "gem",
      "list",
      "-i",
      "password"
    ];

    it("should return the correct command to check for installation", () => {

      tc = new TaskConfiguration(__dirname);
      ic = new InstallComponents(tc);      

      tc.getTaskParameters();

      expect(ic.isGemInstalledCmd()).to.eql(expected);
    });
  });

  describe("password - latest", () => {

    let expected = [
      "chef",
      "gem",
      "install",
      "password"
    ];

    it("should return command without version condition", () => {
      tc.getTaskParameters();
  
      expect(ic.installCmd()).to.eql(expected);
    });

  });

  describe("password - specific version", () => {

    // set up the inputs for the gem to install
    before(() => {
      inputs["version"] = "1.2.3";
    });

    after(() => {
      process.env.COMPONENT = "";
     delete inputs["version"];
    });

    let expected = [
      "chef",
      "gem",
      "install",
      "password",
      "--version",
      "1.2.3"
    ];

    it("should return the command with the required version", () => {
      tc.getTaskParameters();
  
      expect(ic.installCmd()).to.eql(expected);
    });

  });

});