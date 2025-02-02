const createExpoWebpackConfigAsync = require("@expo/webpack-config");
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

  return config;
};
