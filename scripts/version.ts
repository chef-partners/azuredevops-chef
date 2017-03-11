
import * as fs from 'fs-extra'
import * as path from 'path'
import * as semver from 'semver'

// read in the vss-extension file so that the version number can be incremented
var extension_file = path.join(__dirname, '..', 'vss-extension.json')
var extension = JSON.parse(fs.readFileSync(extension_file, 'utf8'))

// increment the patch version of the extension
extension.version = semver.inc(extension.version, 'patch')

// write out the extension file
fs.writeFileSync(extension_file, JSON.stringify(extension, null, 4))