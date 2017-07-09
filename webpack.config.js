const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        main: './src/App.jsx'
    },
    output: {
        path: './dist',
        filename: 'dist.bundle.js',
        publicPath: '/'
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        })
    ],

    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules\//,
                loaders: [
                    'babel-loader?presets[]=react,presets[]=es2015,presets[]=stage-0'
                ]
            },
            {
                test: /\.scss$/,
                loaders: ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.json$/,
                loaders: ['json-loader']
            }
        ]
    },

    resolve: {
        extensions: ['.js', '.jsx'],
        modules: [
            path.resolve('./src/'),
            'node_modules'
        ],
        symlinks: false
    }
};
