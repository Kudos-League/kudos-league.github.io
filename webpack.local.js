const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const Dotenv = require("dotenv-webpack");

module.exports = async (env, argv) => {
  const config = await common(env, argv);
  return merge(config, {
    mode: "development",
    plugins: [
      new Dotenv({
        path: "./.env",
        systemvars: true,
      }),
    ],
  });
};
