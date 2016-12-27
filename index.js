/**
 *  Entry point to fulfill. Export function to generate botmaster outoing middleware
 */

const R = require('ramda');
const {fulfill} = require('./fulfill');
const {
    defaultUpdateToContext,
    defaultUpdateToResponse,
    defaultResponseToUpdate,
} = require('./botmaster');

/**
 * Generate outgoing middleware for fulfill
 * @param  {Object} options.actions the actions to use
 * @param  {Object} options.updateToContext optional, a function that receives the botmaster {bot, update} and turns into the fulfill context
 * @param  {Object} options.updateToResponse optional, a function that receives the botmaster (bot, update} and turns into the fulfill response
 * @return {function}         outgoing middleware
 */
const handleOutgoing = options => (bot, update, next) => {
    const updateToContext = options.updateToContext || defaultUpdateToContext;
    const updateToResponse = options.updateToResponse || defaultUpdateToResponse;
    const responseToUpdate = options.responseToUpdate || defaultResponseToUpdate;
    console.log(`fulfill using actions: ${JSON.stringify(options.actions)}`);
    console.log(`fulfill received update: ${JSON.stringify(update)}`);
    console.log(`fulfill using as input: ${updateToResponse({bot, update})}`);
    fulfill(
        options.actions,
        updateToContext({bot, update}),
        updateToResponse({bot, update}),
        (error, response) => {
            update.message.text = response; // can't use immutable paradigms here unfortunately
            console.log(`fulfill sending new update: ${JSON.stringify(update)}`);
            next(error);
        }
    );
};

module.exports = handleOutgoing;
