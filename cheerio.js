/**
 *  Utilities module for working with cheerio.
 */

/*const cheerio = require('cheerio');

// Load a String representing the response using cheerio and return the cheerio object
const loadCheerio = responseString => cheerio.load(responseString, {
    xmlMode: true,
    recognizeSelfClosing: true,
    normalizeWhitespace: false,
    decodeEntities: false,
    withDomLvl1: false
});

*/
const getText = $ => $.asHtml();

/*const jsdom = require('jsdom');
const jquery = require('jquery');

const loadCheerio = input => new Promise((resolve, reject) => {
    jsdom.env(input, {parsingMode: 'xml'}, (error, window) => {
        if (error) reject(error);
        else {
            const $ = jquery(window);
            resolve($);
        }
    });
});
*/

const libxmljs = require('libxmljs');

const loadCheerio = libxmljs.parseXmlString;

module.exports = {
    loadCheerio,
    getText
};
