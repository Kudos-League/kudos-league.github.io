module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "@babel/plugin-transform-flow-strip-types",
      [
        "module-resolver",
        {
          alias: {
            pages: "./src/pages",
            redux_store: "./src/redux_store",
            shared: "./src/shared",
          },
        },
      ],
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
