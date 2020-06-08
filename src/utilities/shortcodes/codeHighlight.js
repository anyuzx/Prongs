// shortcodes for code highlighting
// it can either highlight string enclosed between the tags or
// highlight the content from an external file
const mdRender = require('../lib/mdRender.js')
const fs = require('fs')

module.exports = function (rawString, language, file) {
    const prefix = `\`\`\`${language}\n`;
    if (file === undefined) {
        return mdRender.render(prefix + rawString)
    }
    else {
        fileContent = fs.readFileSync(file, {encoding: 'utf8'})
        return mdRender.render(prefix + fileContent)
    }
}