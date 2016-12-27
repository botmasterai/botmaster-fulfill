/**
 *  Botmaster middleware generating function to connect fulfill to botmaster as outgoing middleware.
 */

const R = require('ramda');
const {fulfill} = require('./fulfill');
const debug = require('debug')('botmaster:fulfill');

// Utility functions for working with botmaster
const textLens = R.lensPath(['update', 'message', 'text']);
const defaultUpdateToInput= R.view(textLens);
const defaultResponseToUpdate = (update, response) => update.message.text = response; // can't use immutable paradigms here unfortunately

/**
 * Generate outgoing middleware for fulfill
 * @param  {Object} options.actions the actions to use
 * @param  {Object} options.updateToContext optional, a function that receives the botmaster {bot, update} and turns into the fulfill context
 * @param  {Object} options.updateToResponse optional, a function that receives the botmaster (bot, update} and turns into the fulfill response
 * @return {function}         outgoing middleware
 */
const outgoing = options => (bot, update, next) => {
    debug(`fulfill received update: ${JSON.stringify(update)}`);
    const {
        actions = {},
        updateToInput = defaultUpdateToInput,
        responseToUpdate = defaultResponseToUpdate,
        context = {}
    } = options;
    debug(`fulfill using actions: ${JSON.stringify(actions)}`);
    debug(`fulfill using as input: ${updateToInput({bot, update})}`);
    context.bot = bot;
    context.update = update;
    fulfill(
        options.actions,
        context,
        updateToInput({bot, update}),
        (error, response) => {
            responseToUpdate(update, response);
            next(error);
            debug(`fulfill sent new update: ${JSON.stringify(update)}`);
        }
    );
};

module.exports = {
    outgoing
};
