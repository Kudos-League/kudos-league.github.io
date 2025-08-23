/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
    webpack: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        },
        configure: (webpackConfig) => {
            webpackConfig.optimization.minimize = true;
            webpackConfig.optimization.minimizer = [
                new TerserPlugin({
                    terserOptions: {
                        compress: false,
                        mangle: false,
                        format: {
                            beautify: true,
                            comments: true
                        }
                    }
                })
            ];

            webpackConfig.plugins.push(
                new BundleAnalyzerPlugin({
                    analyzerMode: 'disabled',
                    generateStatsFile: true,
                    statsFilename: 'stats.json'
                })
            );

            return webpackConfig;
        }
    },
    babel: {
        plugins: []
    }
};
