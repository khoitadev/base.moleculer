module.exports = {
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "./tsconfig.json", // Đường dẫn đến tệp tsconfig.json
		sourceType: "module",
	},
	// parserOptions: { project: ["./tsconfig.json"] },
	plugins: ["@typescript-eslint"],
	root: true,
	rules: {
		"@typescript-eslint/no-explicit-any": 0,
		"@typescript-eslint/no-var-requires": 0,
		"@typescript-eslint/no-this-alias": 0,
		"no-mixed-spaces-and-tabs": 0,
		"no-async-promise-executor": 0,
		"no-undef": 0,
	},
	semi: ["error", "always"],
};
