const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const Dotenv = require("dotenv-webpack");
const path = require("path");

module.exports = async function (env, argv) {
  const mode = argv?.mode || "none";
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ["nativewind"],
      },
      mode,
    },
    argv
  );

  config.resolve.alias = {
    ...config.resolve.alias,
    "react-native/Libraries/Image/AssetRegistry": path.resolve(
      __dirname,
      "stubs/AssetRegistry.js"
    ),
  };

  config.plugins.push(
    new Dotenv({
      systemvars: true,
    })
  );

  return config;
};
