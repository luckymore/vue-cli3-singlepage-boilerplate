const path = require('path')
const PrerenderSPAPlugin = require('prerender-spa-plugin')
const WebpackScpUploadPlugin = require('webpack-scp-upload-plugin')

const isProductionEnvFlag = process.env.NODE_ENV === 'production'
const enableVW = true // 是否应用vw适配

function resolveRealPath(dir) {
  return path.join(__dirname, dir)
}

function addStyleResource() {
  return ['_variables.less', 'mixins.less'].map(v => path.resolve(__dirname, `src/assets/styles/${v}`))
}

// https://github.com/vuejs/vue-docs-zh-cn/blob/master/vue-cli/config.md
module.exports = {
  // TODO: 设置 / 才可以进行 prerender
  publicPath: '//xinpincall.jd.com/www/vue-cli3/',
  outputDir: 'dist',

  // when set to 'error', lint errors will cause compilation to fail.
  lintOnSave: true,

  // https://cli.vuejs.org/config/#runtimecompiler
  runtimeCompiler: false,

  // babel-loader skips `node_modules` deps by default.
  // explicitly transpile a dependency with this option.
  transpileDependencies: [
    /* string or regex */
  ],

  // generate sourceMap for production build?
  productionSourceMap: process.env.NODE_ENV !== 'production',

  // https://github.com/vuejs/vue-cli/blob/dev/docs/css.md (#Need to put the top)
  css: {
    loaderOptions: {
      postcss: {
        // 如果是移动端使用VM适配方案，否则不采用适配方案
        plugins: enableVW
          ? [
              require('postcss-px-to-viewport')({
                viewportWidth: 375,
                viewportHeight: 667,
                unitPrecision: 2,
                viewportUnit: 'vw',
                selectorBlackList: ['.ignore', '.hairlines'],
                minPixelValue: 1,
                mediaQuery: false
              })
            ]
          : []
      }
    }
  },

  // tweak internal webpack configuration.
  // see https://github.com/vuejs/vue-cli/blob/dev/docs/webpack.md
  chainWebpack: config => {
    config.resolve.alias
      .set('vue$', 'vue/dist/vue.esm.js')
      .set('@helper', resolveRealPath('src/helper'))
      .set('@pages', resolveRealPath('src/pages'))
      .set('@assets', resolveRealPath('src/assets'))
      .set('@router', resolveRealPath('src/router'))
      .set('@mixins', resolveRealPath('src/mixins'))
      .set('@components', resolveRealPath('src/components'))

    config.module.rules.delete('svg')
    config.module
      .rule('svg')
      .test(/\.svg$/)
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        name: '[name]-[hash:7]',
        prefixize: true
      })

    // 分包
    const splitOptions = config.optimization.get('splitChunks')
    config.optimization.splitChunks(
      Object.assign({}, splitOptions, {
        // （缺省值5）按需加载时的最大并行请求数
        maxAsyncRequests: 16,
        // （默认值3）入口点上的最大并行请求数
        maxInitialRequests: 16,
        // （默认值：1）分割前共享模块的最小块数
        minChunks: 1,
        // （默认值：30000）块的最小大小
        minSize: 30000,
        // webpack 将使用块的起源和名称来生成名称: `vendors~main.js`,如项目与"~"冲突，则可通过此值修改，Eg: '-'
        automaticNameDelimiter: '~',
        // cacheGroups is an object where keys are the cache group names.
        name: true,
        cacheGroups: {
          default: false,
          common: {
            name: `chunk-common`,
            minChunks: 2,
            priority: -20,
            chunks: 'initial',
            reuseExistingChunk: true
          },
          element: {
            name: 'element',
            test: /[\\/]node_modules[\\/]element-ui[\\/]/,
            chunks: 'initial',
            // 默认组的优先级为负数，以允许任何自定义缓存组具有更高的优先级（默认值为0）
            priority: -30
          }
        }
      })
    )

    // plugin
    config.plugin('prefetch').tap(options => {
      options.fileBlacklist = options.fileBlacklist || []
      options.fileBlacklist.push([/myasyncRoute(.)+?\.js$/])
      return options
    })

    // img资源路径，默认为相对路径，相对于link标签的herf
    // if (!isM) {
    //   config.plugin('html-pc').tap(args => {
    //     args[0].minify = { removeComments: false, collapseWhitespace: true, removeAttributeQuotes: true, collapseBooleanAttributes: true, removeScriptTypeAttributes: true }
    //     return args
    //   })
    // }

    // if (isM) {
    //   config.module
    //     .rule('images')
    //     .use('url-loader')
    //     .tap(options => {
    //       return merge(options, {
    //         publicPath: BASEURL,
    //         limit: 3000
    //       })
    //     })

    //   config.module
    //     .rule('svg')
    //     .use('file-loader')
    //     .tap(options => ((options.publicPath = BASEURL), options))
    // }

    // config.module
    //   .rule('fonts')
    //   .use('url-loader')
    //   .tap(options => ((options.publicPath = BASEURL), options))

    // https://github.com/webpack-contrib/webpack-bundle-analyzer
    if (process.env.npm_config_report) {
      config.plugin('webpack-bundle-analyzer').use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
    }
  },

  configureWebpack: config => {
    if (isProductionEnvFlag)
      config.plugins.push(
        new PrerenderSPAPlugin({
          staticDir: path.join(__dirname, 'dist'),
          routes: ['/', '/explore']
        }),
        new WebpackScpUploadPlugin({
          host: '192.168.177.101',
          password: 'B0$7zDXH',
          local: 'dist',
          path: '/home/www/chuwei-festival'
        })
      )
  },

  parallel: require('os').cpus().length > 1,

  // see => https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-pwa
  // https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin
  pwa: {
    name: 'Vue-Cli3 实践',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    iconPaths: {
      favicon32: 'img/icons/fuji-mountain-32x32.png',
      favicon16: 'img/icons/fuji-mountain-16x16.png',
      appleTouchIcon: 'img/icons/apple-touch-icon-152x152.png',
      maskIcon: 'img/icons/safari-pinned-tab.svg',
      msTileImage: 'img/icons/msapplication-icon-144x144.png'
    },
    // configure the workbox plugin (GenerateSW or InjectManifest)
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      // swSrc is required in InjectManifest mode.
      swSrc: 'public/service-worker.js'
      // ...other Workbox options...
    }
  },

  // configure webpack-dev-server behavior
  devServer: {
    open: process.platform === 'darwin',
    host: '0.0.0.0',
    port: 8080,
    https: false,
    hotOnly: false,
    // See https://github.com/vuejs/vue-cli/blob/dev/docs/cli-service.md#configuring-proxy
    proxy: null, // string | Object
    before: () => {}
  },

  // options for 3rd party plugins
  pluginOptions: {
    'style-resources-loader': {
      preProcessor: 'less',
      patterns: addStyleResource()
    }
  }
}
