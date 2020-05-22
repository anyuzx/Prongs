const { PurgeCSS } = require('purgecss')

const pattern = /<style>.*?<\/style>/s;

module.exports = async function purgeStyles (content, outputPath) {
    if(outputPath && outputPath.endsWith(".html")) {
        const purgeCSSResult = await new PurgeCSS().purge({
            content: [{
                raw: content,
                extension: 'html'
            }],
            css: ['dist/_includes/css/main.css', 'dist/_includes/css/highlight.css', 'dist/_includes/css/typeset.css'],
            // This is the function used to extract class names from your templates
            defaultExtractor: content => {
                // Capture as liberally as possible, including things like `h-(screen-1.5)`
                const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []

                // Capture classes within other delimiters like .block(class="w-1/2") in Pug
                const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || []

                return broadMatches.concat(innerMatches)
            }
        })
            .then(res => { return res.reduce(function (accumulator, currentValue, idx) {
                return idx == 0 ? currentValue.css : accumulator + currentValue.css
               }, '')
            })
        
        return content.replace(pattern, `<style>${purgeCSSResult}</style>`)
    }
    return content
}