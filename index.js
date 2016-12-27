/**
 *  Entry point to fulfill. Export function to generate botmaster outoing middleware as well as raw fulfill function
 */

const {fulfill} = require('./fulfill');
const {outgoing} = require('./outgoing');

module.exports = {
    outgoing,
    fulfill
};
