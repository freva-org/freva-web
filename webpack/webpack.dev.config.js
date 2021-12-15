var path = require("path");
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');

var mode = 'development'
var entry = [
  'webpack-dev-server/client?http://localhost:8080',
  'webpack/hot/only-dev-server',
  './assets/js/index'
];

// override django's STATIC_URL for webpack bundles
var output = { publicPath: 'http://localhost:8080/assets/bundles/'};

// Add HotModuleReplacementPlugin and BundleTracker plugins
var plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoEmitOnErrorsPlugin()
];

module.exports = function getDevConfig () {
  return {
    mode,
    entry,
    resolve: { extensions: [".js"] },
    output,
    plugins
  };
};
