// Grundkonfiguration utökad med regler från docs/standard.md
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  { ignores: ["dist/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      // docs/standard.md: Inga personuppgifter (namn, e-post) i loggar. Förhindra godtycklig console.log i källkod.
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
      // docs/standard.md: Tjänstelagret och routes ska ha tydliga typer
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
