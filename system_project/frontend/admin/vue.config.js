const path = require('path')

module.exports = {
  publicPath: './',
  outputDir: 'dist',
  assetsDir: 'static',
  lintOnSave: false,
  productionSourceMap: false,
  devServer: {
    port: 9532,
    host: '0.0.0.0',
    open: true,
    hot: true,
    disableHostCheck: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        // 关键修正：去掉/api前缀，转发到后端根路径
        pathRewrite: {
          '^/api': ''
        },
        logLevel: 'debug'
      }
    },
    // 解决 sockjs-node 连接问题
    sockHost: 'localhost',
    sockPort: 9532
  }
}