var path = require("path");
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');
//var ESLintPlugin = require("eslint-webpack-plugin");

module.exports = function getBaseConfig() {
    return {
        // context: path.resolve(__dirname, ".."),
        output: {
            path: path.resolve('./assets/bundles/'),
            filename: "[name]-[fullhash].js"
        },
        optimization: {
            moduleIds: 'named',
        },
        plugins: [
            new BundleTracker({filename: './webpack-stats.json'}),
        ],
    //    plugins: [
    //      new ESLintPlugin()
    //    ],
    //
        module: {
            rules: [
                { test: /\.js?$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"]
                    }
                },
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
            extensions: ['', '.js', '.jsx', '.css', '.ts']
        },
    };
}