import * as path from "path"
import * as fs from "fs-extra"
import * as common from "./common"
import {sprintf} from "sprintf-js";

// determine the build directory
let build_dir = path.join(__dirname, "..", "build")

// create preview manifest file and set the appropriate flags in each
function setManifests() {

    // set the file names
    let production_manifest_file = path.join(build_dir, "vss-extension.json")
    let preview_manifest_file = path.join(build_dir, "vss-extension-preview.json")

    // copy the main vss-extension file
    common.copyFileSync(production_manifest_file, preview_manifest_file);

    // PREVIEW patching
    // read in the file
    let preview_manifest = JSON.parse(fs.readFileSync(preview_manifest_file, 'utf8'));

    // reset the id so that it contains a preview suffix
    preview_manifest.id = sprintf("%s-preview", preview_manifest.id)

    // update the name so that it also carries the preview flag
    preview_manifest.name = sprintf("%s - PREVIEW", preview_manifest.name)

    // set the gallery flag
    preview_manifest.galleryFlags.push("Preview")

    // save the file
    fs.writeFileSync(preview_manifest_file, JSON.stringify(preview_manifest, null, 4))

    // PRODUCTION patching
    let production_manifest = JSON.parse(fs.readFileSync(production_manifest_file, 'utf8'))

    // set the gallery flag
    production_manifest.galleryFlags.push("Public")    

    fs.writeFileSync(production_manifest_file, JSON.stringify(production_manifest, null, 4))
}

setManifests();
