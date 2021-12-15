const { merge } = require("webpack-merge");

var baseConfig = require('./webpack/webpack.base.config.js');
var devConfig  = require('./webpack/webpack.dev.config.js');
var prodConfig = require('./webpack/webpack.prod.config.js');

let config;
if (["build", "dev"].includes(process.env.npm_lifecycle_event)) {
    config = merge(devConfig(), baseConfig(), { node: { __dirname: true } });
} else {
    // production
    config = merge(prodConfig(),  baseConfig(), { node: { __dirname: true } });
}

module.exports = config;
