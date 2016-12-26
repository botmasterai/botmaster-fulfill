/**
 *  Entry point to fulfill. Export function to generate botmaster outoing middleware
 */

const R = require('ramda');
const {fulfill} = require('./fulfill');
const {
    defaultUpdateToContext,
    defaultUpdateToResponse,
    responseToUpdate,
} = require('./botmaster');

/**
 * Generate outgoing middleware for fulfill
 * @param  {Object} options.actions the actions to use
 * @param  {Object} options.updateToContext optional
 * @param  {Object} options.updateToResponse optional
 * @return {function}         outgoing middleware
 */
const handleOutgoing = options => (bot, update, next) => {
    const updateToContext = options.updateToContext ? options.update.updateToContext : defaultUpdateToContext;
    const updateToResponse = options.updateToResponse ? options.update.updateToResponse : defaultUpdateToResponse;
    fulfill(
        options.actions,
        updateToContext({bot, update}),
        updateToResponse({bot, update})
    ).then( (error, response) => {
        if (response.response) {
            R.compose(responseToUpdate)(response.response);
        }
        next();
    });
};

module.exports = handleOutgoing;
