import * as path from "path";
import * as fs from "fs-extra";
import * as common from "./common";
import {sprintf} from "sprintf-js";

// create preview manifest file and set the appropriate flags in each
export function configure(build_config) {

    console.log("Setting gallery flags");

    // set the file names
    let production_manifest_file = path.join(build_config.dirs.output, "production", "vss-extension.json");
    let preview_manifest_file = path.join(build_config.dirs.output, "preview", "vss-extension.json");

    // PREVIEW patching
    console.log("Patching: PREVIEW");

    // read in the file
    let preview_manifest = JSON.parse(fs.readFileSync(preview_manifest_file, "utf8"));

    // reset the id so that it contains a preview suffix
    console.log("  add preview suffix to id");
    preview_manifest.id = sprintf("%s-preview", preview_manifest.id);

    // update the name so that it also carries the preview flag
    console.log("  add PREVIEW suffix to title");
    preview_manifest.name = sprintf("%s - PREVIEW", preview_manifest.name);

    // set the gallery flag
    console.log("  setting Peview gallery flag");
    preview_manifest.galleryFlags.push("Preview");

    // save the file
    fs.writeFileSync(preview_manifest_file, JSON.stringify(preview_manifest, null, 4));

    // PRODUCTION patching
    console.log("Patching: PRODUCTION");

    let production_manifest = JSON.parse(fs.readFileSync(production_manifest_file, "utf8"));

    // set the gallery flag
    console.log("  setting Public gallery flag");
    production_manifest.galleryFlags.push("Public");

    fs.writeFileSync(production_manifest_file, JSON.stringify(production_manifest, null, 4));
}
