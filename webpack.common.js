const path = require("path");
const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const webpack = require("webpack");

module.exports = async function (env, argv) {
  const mode = argv.mode || "none";
  const config = await createExpoWebpackConfigAsync({ ...env, mode }, argv);

  if (!config.resolve.plugins) {
    config.resolve.plugins = [];
  }

  config.resolve.plugins.push(
    new TsconfigPathsPlugin({
      configFile: path.resolve(__dirname, "tsconfig.json"),
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    })
  );

  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    buffer: require.resolve("buffer/"),
    vm: false,
  };

  config.resolve.alias = {
    ...config.resolve.alias,
    "react-native": "react-native-web",
  };

  config.plugins.push(
    new webpack.IgnorePlugin({
      resourceRegExp: /@stripe\/stripe-react-native/,
    })
  );

  config.output = {
    ...config.output,
    publicPath: "/",
  };

  return config;
};
