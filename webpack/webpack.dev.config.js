const path = require("path");

const webpack = require("webpack");

const mode = "development";

const isDevServer = !!(process.env.npm_lifecycle_event === "dev");

const SERVER_HOST = "127.0.0.1";
const SERVER_PORT = 8086;

const entry = isDevServer
  ? [`webpack-dev-server/client`, "./assets/js/index"]
  : path.resolve("./assets/js/index");

let output;
let devServer;
let plugins;
if (isDevServer) {
  // override django's STATIC_URL for webpack bundles
  output = {
    publicPath: `http://${SERVER_HOST}:${SERVER_PORT}/assets/bundles/`,
  };
  devServer = {
    allowedHosts: "all",
    hot: true,
    historyApiFallback: true,
    port: SERVER_PORT,
    client: {
      logging: "verbose",
      webSocketURL: `ws://${SERVER_HOST}:${SERVER_PORT}/ws`,
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  // Add HotModuleReplacementPlugin and BundleTracker plugins
  plugins = [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ];
}

module.exports = function getDevConfig() {
  return {
    target: "web",
    mode,
    entry,
    resolve: { extensions: [".js"] },
    output,
    plugins,
    devServer,
  };
};
