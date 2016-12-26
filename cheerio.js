/**
 *  Utilities module for working with cheerio.
 */

const cheerio = require('cheerio');

// Load a String representing the response using cheerio and return the cheerio object
const loadCheerio = responseString => cheerio.load(responseString, {
    xmlMode: true,
    normalizeWhitespace: false,
    decodeEntities: false,
    withDomLvl1: false
});

const getText = $ => $.asHtml();

module.exports = {
    loadCheerio,
    getText
};
