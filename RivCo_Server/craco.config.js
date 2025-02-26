const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.plugins.push(
        new CompressionPlugin({
          filename: "[path][base].gz",
          algorithm: "gzip",
          test: /\.(js|css|html|svg)$/,
          threshold: 10240, // Only compress files above 10KB
          minRatio: 0.8,
        })
      );
      return webpackConfig;
    },
  },
};