// Keep preload URLs in sync with the content-hashed font delivery assets.
const { fonts } = require("../_includes/fonts/delivery-manifest.json");

module.exports = fonts.filter(font => font.style === "normal");
