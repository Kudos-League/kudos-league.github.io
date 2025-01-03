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
    "react-native-web": require.resolve("react-native-web"),
    pages: path.resolve(__dirname, "src/pages"),
    redux_store: path.resolve(__dirname, "src/redux_store"),
    shared: path.resolve(__dirname, "src/shared"),
    "react-native/Libraries/Utilities/Platform":
      "react-native-web/dist/exports/Platform",
    "react-native/Libraries/Components/View/View":
      "react-native-web/dist/exports/View",
    "react-native/Libraries/Components/ScrollView/ScrollView":
      "react-native-web/dist/exports/ScrollView",
    "react-native/Libraries/Image/Image": "react-native-web/dist/exports/Image",
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

  if (config.devServer && config.devServer._assetEmittingPreviousFiles) {
    delete config.devServer._assetEmittingPreviousFiles;
  }

  return config;
};
