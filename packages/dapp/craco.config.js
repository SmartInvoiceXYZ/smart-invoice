module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      var babelRules = webpackConfig.module.rules[1];
      var extJsRule = babelRules.oneOf.find(
        rule =>
          rule.loader && rule.loader.includes('babel-loader') && rule.exclude,
      );
      extJsRule.include =
        /node_modules\/(@metamask|@noble|@wagmi|@walletconnect|unws|viem|wagmi)/;
      extJsRule.type = 'javascript/auto';
      return webpackConfig;
    },
  },
};
