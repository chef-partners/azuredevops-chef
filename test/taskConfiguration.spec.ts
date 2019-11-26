// Import necessary libraries
import { TaskConfiguration } from "../src/common/taskConfiguration";
import { expect } from "chai";
import { join as pathJoin } from "path";

describe("Task Configuration", () => {

  // Check that the platform is correctly detected as windows and that
  // the paths are setup correctly
  describe("Windows", () => {

    let tc = new TaskConfiguration(__dirname, "win32");

    it("should detect running on Windows", () => {
      expect(tc.IsWindows).to.equal(true);
    });

    describe("Paths", () => {

      // define the paths to test
      let chefWorkstationDir = pathJoin("C:", "opscode", "chef-workstation");
      
      let binChef = pathJoin(chefWorkstationDir, "bin", "chef.bat");
      let binBerks = pathJoin(chefWorkstationDir, "bin", "berks.bat");
      let binInspec = pathJoin(chefWorkstationDir, "bin", "inspec.bat");
      let binKnife = pathJoin(chefWorkstationDir, "bin", "knife.bat");

      let pathScript = pathJoin(__dirname, "scripts", "install.ps1");

      it(chefWorkstationDir, () => {
        expect(tc.Paths.ChefWorkstationDir).to.equal(chefWorkstationDir);
      });

      it (binChef, () => {
        expect(tc.Paths.Chef).to.equal(binChef);
      });

      it (binBerks, () => {
        expect(tc.Paths.Berks).to.equal(binBerks);
      });

      it (binInspec, () => {
        expect(tc.Paths.InspecEmbedded).to.equal(binInspec);
      });

      it (binKnife, () => {
        expect(tc.Paths.Knife).to.equal(binKnife);
      });

      it (pathScript, () => {
        expect(tc.Paths.Script).to.equal(pathScript);
      });
    });
  });

  // Ensure that the paths are setup correctly for Linux
  describe("Linux", () => {

    let tc = new TaskConfiguration(__dirname, "linux");

    it("should detect NOT running on Windows", () => {
      expect(tc.IsWindows).to.equal(false);
    });

    describe("Paths", () => {

      // define the paths to test
      let chefWorkstationDir = pathJoin("/", "opt", "chef-workstation");
      
      let binChef = pathJoin(chefWorkstationDir, "bin", "chef");
      let binBerks = pathJoin(chefWorkstationDir, "bin", "berks");
      let binInspec = pathJoin(chefWorkstationDir, "bin", "inspec");
      let binKnife = pathJoin(chefWorkstationDir, "bin", "knife");

      let pathScript = pathJoin(__dirname, "scripts", "install.sh");

      it(chefWorkstationDir, () => {
        expect(tc.Paths.ChefWorkstationDir).to.equal(chefWorkstationDir);
      });

      it (binChef, () => {
        expect(tc.Paths.Chef).to.equal(binChef);
      });

      it (binBerks, () => {
        expect(tc.Paths.Berks).to.equal(binBerks);
      });

      it (binInspec, () => {
        expect(tc.Paths.InspecEmbedded).to.equal(binInspec);
      });

      it (binKnife, () => {
        expect(tc.Paths.Knife).to.equal(binKnife);
      });

      it (pathScript, () => {
        expect(tc.Paths.Script).to.equal(pathScript);
      });
    });
  });

  // ensure that an error is thrown when an unknown OS is presented
  describe("Unsupported platform", () => {

    it("should throw an error", () => {
      expect(() => { let tc = new TaskConfiguration(__dirname, "darwin"); }).to.throw("darwin is not a supported platform");
    });
  });
  
});