/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: [
    "./options/*.tsx",
    "./popup/*.tsx",
    "./contents/*.tsx",
    "./components/*.tsx"
  ],
  theme: {
    extend: {}
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light"]
  }
}
