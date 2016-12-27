/**
 *  Utility functions for working with botmaster
 */

const R = require('ramda');

const textLens = R.lensPath(['update', 'message', 'text']);

const defaultUpdateToContext =  R.identity;
const defaultUpdateToResponse = R.view(textLens);
const defaultResponseToUpdate = R.set(textLens);

module.exports = {
    defaultUpdateToResponse,
    defaultUpdateToContext,
    defaultResponseToUpdate
};
