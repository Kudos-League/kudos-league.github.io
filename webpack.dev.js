const { merge } = require("webpack-merge");
const common = require("./webpack.config.js");

module.exports = async (env, argv) => {
  argv.mode = argv.mode || "development";
  const config = await common(env, argv);
  return merge(config, {
    mode: "development"
  });
};
