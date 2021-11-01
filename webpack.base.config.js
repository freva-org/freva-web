var path = require("path");
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');

module.exports = {
    context: __dirname,
    mode : 'production',
    output: {
        path: path.resolve('./assets/bundles/'),
        filename: "[name]-[fullhash].js"
    },
    optimization: {
        moduleIds: 'named',
    },
    plugins: [],

    module: {
        rules: [
            {
                test: /\.json$/,
                use: ['json-loader'],
                type: 'javascript/auto'
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            }
        ]
    },

    resolve: {
        modules: ['node_modules', 'bower_components'],
        extensions: ['', '.js', '.jsx', '.css', '.ts']
    },

    externals: [
	  {
	      xmlhttprequest: 'XMLHttpRequest'
          }
    ]
};
