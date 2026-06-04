module.exports = {
  presets: [
    ["@babel/preset-typescript", { allExtensions: true, isTSX: true, onlyRemoveTypeImports: true }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: [["babel-plugin-react-compiler", { target: "19", panicThreshold: "none" }]],
};
