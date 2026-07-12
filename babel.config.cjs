module.exports = {
  presets: [
    ["@babel/preset-typescript", { onlyRemoveTypeImports: true }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: [["babel-plugin-react-compiler", { target: "19", panicThreshold: "none" }]],
};
