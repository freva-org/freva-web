const { merge } = require("webpack-merge");

const baseConfig = require("./webpack/webpack.base.config");
const devConfig = require("./webpack/webpack.dev.config");
const prodConfig = require("./webpack/webpack.prod.config");
const webpack = require('webpack');

const Dotenv = require("dotenv-webpack");

let config;
if (["build", "dev"].includes(process.env.npm_lifecycle_event)) {
  config = merge(
    devConfig(),
    baseConfig(),
    { node: { __dirname: true } },
    {
      plugins: [
        new Dotenv(),
        // Work around for Buffer is undefined:
        // https://github.com/webpack/changelog-v5/issues/10
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        }),
        new webpack.ProvidePlugin({
          process: "process/browser",
        }),
      ]
    },
    {
      resolve: {
        fallback: {
          stream: require.resolve("stream-browserify"),
          buffer: require.resolve("buffer"),
        },
      },
    });
} else {
  // production
  config = merge(prodConfig(), baseConfig(), { node: { __dirname: true } });
}

module.exports = config;
