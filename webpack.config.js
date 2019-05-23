const path = require("path")
const webpack = require("webpack")
const CopyWebpackPlugin = require("copy-webpack-plugin")

const getMode = env => {
  if (env.production) {
    return "production"
  }
  return "development"
}
const getEntries = env => {
  const entry = {
    main: "./src/index.js",
    "terrain.worker": "./src/terrain.worker.js"
  }
  return entry
}
const getPlugins = env => {
  const plugins = []

  if (!env.production) {
    plugins.unshift(
      new webpack.SourceMapDevToolPlugin({
        filename: "[file].map",
        append: "\n//# sourceMappingURL=[url]"
      })
    )
    plugins.push(
      new CopyWebpackPlugin([
        {
          context: "./src",
          from: "*.html",
          to: "./"
        }
      ])
    )
  }

  return plugins
}

module.exports = env => {
  if (env === undefined) {
    env = { development: true }
  }

  const config = {
    entry: getEntries(env),
    output: {
      path: path.join(__dirname, "dist"),
      filename: "[name].js"
    },
    devServer: {
      contentBase: path.join(__dirname, "dist")
    },
    mode: getMode(env),
    module: {
      rules: [
        // {
        //   test: /\.js$/,
        //   exclude: /node_modules\/(?!@perform)/,
        //   use: ["babel-loader"]
        // },
        {
          test: /\.html$/,
          use: [
            {
              loader: "html-loader",
              options: {
                minimize: true,
                removeComments: true,
                collapseWhitespace: true
              }
            }
          ]
        }
      ]
    },
    plugins: getPlugins(env)
  }

  return config
}
