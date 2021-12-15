var path = require("path");
var webpack = require('webpack');

var mode = 'production'
var entry = path.resolve('./assets/js/index');
var plugins = [
  // removes a lot of debugging code in React
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production')
  }}),
];

module.exports = function getProdConfig () {
  return {
    mode,
    entry,
    resolve: { extensions: [".js"] },
    plugins
  };
};
