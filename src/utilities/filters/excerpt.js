const mdRender = require('../lib/mdRender.js')

const textTruncate = function (str, length, ending) {
    if (length === undefined) {
        length = 300;
    }
    if (ending === undefined) {
        ending = '...'
    }
    if (str.length > length) {
        return str.substring(0, length - ending.length) + ending
    } else {
        return str
    }
}

module.exports = function (object, length, ending) {
    // argument object can be a collection item or page object in eleventy
    // if object is a page object, it has key 'content' or 'excerpt' if it is defined in front matter
    // if object is a collection item, it does not has key content
    // and if it has excerpt defined in front matter, then use it
    // otherwise use the raw content
    // string will be truncated
    const rawString = (() => {
        if (object.content) {
            return textTruncate(object.content, length, ending);
        } else if (object.excerpt) {
            return textTruncate(object.excerpt, length, ending);
        } else if (object.data.excerpt) {
            return textTruncate(object.data.excerpt, length, ending);
        } else if (object.template.frontMatter.content) {
            // raw content of collection item can be accessed through template.frontMatter.content.
            // see https://github.com/11ty/eleventy/issues/1206
            return textTruncate(object.template.frontMatter.content, length, ending);
        }
    })();

    return mdRender.render(rawString)
}