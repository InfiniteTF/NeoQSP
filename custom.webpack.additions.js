module.exports = {
  externals: [
    "react",
    "react-dom"
  ],
  module: {
  rules: [{
			test: /\.wasm$/,
			type: 'javascript/auto',
			loader: 'file-loader',
			options: {
				name: '[name]-[hash].[ext]',
			},
    }]
  }
};
