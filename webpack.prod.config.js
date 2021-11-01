var path = require("path");
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');


var config = require('./webpack.base.config.js');
config.mode = 'production'
config.output.path = require('path').resolve('./assets/dist');
config.entry = path.resolve(__dirname, './assets/js/index.js'),
config.plugins = config.plugins.concat([
  new BundleTracker({filename: './webpack-stats-prod.json'}),

  // removes a lot of debugging code in React
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production')
  }}),

  // keeps hashes consistent between compilations
  //new webpack.optimize.OccurenceOrderPlugin(),
]);

// Add a loader for JSX files
config.module.rules.push(
  { test: /\.js?$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    options: {
      presets: ["@babel/preset-env", "@babel/preset-react"]
    }
  } // to transform JSX into JS
);

module.exports = config;
