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

const stripHtml = function (html) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]*>/g, ' ');
}

const decodeEntities = function (text) {
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

const escapeHtml = function (text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const normalizeWhitespace = function (text) {
    return text.replace(/\s+/g, ' ').trim();
}

const toPlainText = function (str) {
    if (!str) {
        return '';
    }
    // If content already contains HTML tags, do not render it again as markdown.
    if (/<[a-z][\s\S]*>/i.test(str)) {
        return normalizeWhitespace(decodeEntities(stripHtml(str)));
    }
    const rendered = mdRender.render(str);
    return normalizeWhitespace(decodeEntities(stripHtml(rendered)));
}

module.exports = function (object, length, ending) {
    // argument object can be a collection item or page object in eleventy
    // if object is a page object, it has key 'content' or 'excerpt' if it is defined in front matter
    // if object is a collection item, it does not has key content
    // and if it has excerpt defined in front matter, then use it
    // otherwise use the raw content
    // string will be truncated
    const rawString = (() => {
        if (object.excerpt) {
            return object.excerpt;
        } else if (object.data.excerpt) {
            return object.data.excerpt;
        } else if (object.template.frontMatter.content) {
            // raw content of collection item can be accessed through template.frontMatter.content.
            // see https://github.com/11ty/eleventy/issues/1206
            return object.template.frontMatter.content;
        } else if (object.content) {
            return object.content;
        }
        return '';
    })();

    const plainText = toPlainText(rawString);
    const excerpt = textTruncate(plainText, length, ending);

    return `<p>${escapeHtml(excerpt)}</p>`;
}
