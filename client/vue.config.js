const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  outputDir: '../server/public',
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'PDF Signer';
      return args;
    });
  },
});
