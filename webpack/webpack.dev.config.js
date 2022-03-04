const webpack = require("webpack");

const mode = "development";
const entry = [
  "webpack-dev-server/client?http://localhost:8080",
  "webpack/hot/dev-server",
  "./assets/js/index"
];

// override django's STATIC_URL for webpack bundles
const output = { publicPath: "http://localhost:8080/assets/bundles/" };

const devServer = {
  port: 8080,
  host: "localhost",
  historyApiFallback: true,
  client: {
    logging: "verbose",
  }
};

// Add HotModuleReplacementPlugin and BundleTracker plugins
const plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoEmitOnErrorsPlugin()
];

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
