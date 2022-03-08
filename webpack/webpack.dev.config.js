const path = require("path");

const webpack = require("webpack");

const mode = "development";

const isDevServer = !!(process.env.npm_lifecycle_event === "dev");

const entry = isDevServer ?
  [
    "webpack-dev-server/client?http://localhost:8080",
    "webpack/hot/dev-server",
    "./assets/js/index"
  ]
  :
  path.resolve("./assets/js/index");

let output;
let devServer;
let plugins;
if (isDevServer) {
  // override django's STATIC_URL for webpack bundles
  output = { publicPath: "http://localhost:8080/assets/bundles/" };
  devServer = {
    port: 8080,
    host: "localhost",
    historyApiFallback: true,
    client: {
      logging: "verbose",
    }
  };
  // Add HotModuleReplacementPlugin and BundleTracker plugins
  plugins = [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ];
}

module.exports = function getDevConfig () {
  return {
    target: "web",
    mode,
    entry,
    resolve: { extensions: [".js"] },
    output,
    plugins,
    devServer
  };
};
