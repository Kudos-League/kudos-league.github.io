/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
    webpack: {
        alias: { '@': path.resolve(__dirname, 'src') },
        configure: (webpackConfig) => {
            webpackConfig.optimization.minimize = true;
            webpackConfig.optimization.minimizer = [
                new TerserPlugin({
                    terserOptions: { compress: false, mangle: false, format: { beautify: true, comments: true } },
                }),
            ];
            webpackConfig.plugins.push(
                new BundleAnalyzerPlugin({
                    analyzerMode: 'disabled',
                    generateStatsFile: true,
                    statsFilename: 'stats.json',
                })
            );
            return webpackConfig;
        },
    },

    jest: {
        configure: (config) => {
            config.testEnvironment = 'jsdom';

            const allowList = '(axios|react-router|react-router-dom)';
            config.transformIgnorePatterns = (config.transformIgnorePatterns || []).map((p) =>
                p.replace('node_modules', `node_modules/(?!${allowList}/)`)
            );

            config.moduleFileExtensions = Array.from(
                new Set([...(config.moduleFileExtensions || []), 'mjs'])
            );

            config.moduleNameMapper = {
                ...(config.moduleNameMapper || {}),
                '^@/(.*)$': '<rootDir>/src/$1',
                '^(\\.{1,2}/.*)\\.js$': '$1',
            };

            config.setupFilesAfterEnv = [
                ...(config.setupFilesAfterEnv || []),
                '<rootDir>/src/setupTests.ts',
            ];

            return config;
        },
    },

    babel: { plugins: [] },
};