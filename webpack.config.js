const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const webpack = require("webpack");
const fs = require("file-system");
const HtmlWebpackTagsPlugin = require("html-webpack-tags-plugin");
const HtmlWebpackPartialsPlugin = require("html-webpack-partials-plugin");

let htmlTemplates = [],
  moduleList = [];

// Our function that generates our html plugins
function generateHtmlPlugins(templateDir) {
  // Read files in template directory
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
  return templateFiles.map((item) => {
    // Split names and extension
    const parts = item.split(".");
    const name = parts[0];
    const extension = parts[1];
    // Create new HTMLWebpackPlugin with options
    htmlTemplates.push(`${name}.html`);

    return new HTMLWebpackPlugin({
      filename: `${name}.html`,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
    });
  });
}

function getJSModules() {
  let entries = [],
    tempJS = null;
  const templateFiles = fs.readdirSync(path.resolve(__dirname, "./modules"));

  templateFiles.map((item) => {
    let tempName = `${item}`;
    tempName = tempName.toLowerCase();
    tempName = tempName.replace("-", "");

    moduleList.push({
      location: `./modules/${item}/html/index.html`,
      title: tempName,
    });

    if (fs.existsSync(`./modules/${item}/js`)) {
      tempJS = fs.readdirSync(path.resolve(__dirname, `./modules/${item}/js/`));
      entries.push(`./modules/${item}/js/${tempJS[0]}`);
    }
  });

  entries.push("./index.js");
  entries.push("./js/global.js");
  return entries;
}

function generateHtmlModules() {
  let files = [];
  moduleList.map((item) => {
    files.push(
      new HtmlWebpackPartialsPlugin({
        path: path.join(__dirname, item.location),
        location: `${item.title}module`,
        template_filename: "*",
      })
    );
  });

  return files;
}

const jsFiles = getJSModules();
const htmlPlugins = generateHtmlPlugins("./html");

module.exports = {
  entry: jsFiles,
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  devServer: {
    inline: true,
    port: 8080,
    compress: true,
    hot: true,
    watchContentBase: true,
  },
  module: {
    rules: [
      {
        test: /\.(html)$/,
        use: ["html-loader"],
      },
      {
        test: /\.(svg|png|jpg|gif)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "[name].[ext]",
            outputPath: "assets/img",
          },
        },
      },
      {
        test: [/\.scss$/, /\.sass$/],
        use: [
          {
            loader: "file-loader",
            options: {
              name: "style.css",
            },
          },
          {
            loader: "extract-loader",
          },
          {
            loader: "css-loader",
          },
          {
            loader: "postcss-loader",
          },
          {
            loader: "sass-loader",
          },
          {
            loader: "webpack-import-glob-loader",
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new CleanWebpackPlugin(),
    new HtmlWebpackTagsPlugin({ tags: ["./style.css"], append: true }),
  ].concat(htmlPlugins),
};
