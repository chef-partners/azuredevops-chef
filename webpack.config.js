// include libs
const path = require("path");
const fs = require("fs");

// initialise the copy-webpack-plugin so that the task.json files are
// copied into the dist folder for each task
const copyWebpackPlugin = require("copy-webpack-plugin");

// build up the entries to be compiled
const entries = {};
const srcDir = path.join(__dirname, "src");
fs.readdirSync(srcDir)
  .filter(dir => fs.statSync(path.join(srcDir, dir)).isDirectory() && dir != "common")
  .forEach(dir => (entries[dir] = "./" + path.join("src", dir, dir)))

var config = {
  devtool: "inline-source-map",
  devServer: {
    https: true,
    port: 3000
  },
  entry: entries,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node-modules/
      }
    ]
  },
  output: {
    filename: "[name]/[name].js"
  },  
  plugins: [
    new copyWebpackPlugin(
      [
        {
          from: "**/task.json",
          context: "src"
        },
        {
          from: "**/icon.png",
          context: "src"
        },
        {
          from: "conf/*.json",
          to: "../.."
        },
        {
          from: "common",
          to: "common",
          context: "src"
        }
      ]
    )
  ],
  resolve: {
    extensions: [
      ".ts",
      ".js",
      ".json"
    ]
  },
  target: 'node'
};

module.exports = (env, argv) => {

  // set the output based on the mode
  var buildPath = path.join(__dirname, "build", "preview", "tasks");
  if (argv.mode === "production") {
    buildPath = path.join(__dirname, "build", "release", "tasks");
  }

  console.log(buildPath);
  config.output.path = buildPath;

  return config;
};