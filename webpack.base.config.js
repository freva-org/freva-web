var path = require("path");
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');

module.exports = {
    context: __dirname,

    entry: ['babel-polyfill', './assets/js/index'],

    output: {
        path: path.resolve('./assets/bundles/'),
        filename: "[name]-[hash].js"
    },

    plugins: [],

    module: {
        rules: [
            {
                test: /\.json$/,
                use: 'json-loader'
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            }
        ]
    },

    resolve: {
        modules: ['node_modules', 'bower_components'],
        extensions: ['', '.js', '.jsx', 'css']
    },

    externals: [
	  {
	      xmlhttprequest: 'XMLHttpRequest'
          }
    ]
};
