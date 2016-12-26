/**
 *  Utility functions for working with botmaster
 */

const R = require('ramda');

const defaultUpdateToContext =  R.identity;
const defaultUpdateToResponse = R.identity;
const responseToUpdate = R.identity;

module.exports = {
    defaultUpdateToResponse,
    defaultUpdateToContext,
    responseToUpdate
};
