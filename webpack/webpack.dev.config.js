const path = require("path");

const webpack = require("webpack");

const mode = "development";

const isDevServer = !!(process.env.npm_lifecycle_event === "dev");

// Defaults serve the bundles from http://127.0.0.1:8086 directly. The dev
// containers set WEBPACK_DEV_HOST=0.0.0.0 and WEBPACK_DEV_PUBLIC_URL="" so
// the bundles and the hot-reload socket go through the proxy on the page's
// own origin instead (see docker/dev/Caddyfile).
const SERVER_HOST = process.env.WEBPACK_DEV_HOST || "127.0.0.1";
const SERVER_PORT = Number(process.env.WEBPACK_DEV_PORT || 8086);
const PUBLIC_URL = process.env.WEBPACK_DEV_PUBLIC_URL;
const BEHIND_PROXY = PUBLIC_URL !== undefined;

const entry = isDevServer
  ? [`webpack-dev-server/client`, "./assets/js/index"]
  : path.resolve("./assets/js/index");

let output;
let devServer;
let plugins;
if (isDevServer) {
  // override django's STATIC_URL for webpack bundles
  output = {
    publicPath: BEHIND_PROXY
      ? `${PUBLIC_URL}/assets/bundles/`
      : `http://${SERVER_HOST}:${SERVER_PORT}/assets/bundles/`,
  };
  devServer = {
    allowedHosts: "all",
    hot: true,
    historyApiFallback: true,
    host: process.env.WEBPACK_DEV_HOST, // unset: webpack-dev-server default
    port: SERVER_PORT,
    client: {
      logging: "verbose",
      // "auto://0.0.0.0:0" means: whatever origin the page was loaded from.
      webSocketURL: BEHIND_PROXY
        ? "auto://0.0.0.0:0/ws"
        : `ws://${SERVER_HOST}:${SERVER_PORT}/ws`,
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
