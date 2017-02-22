/**
 *  Botmaster middleware generating function to connect fulfill to botmaster as outgoing middleware.
 *  @private
 */

const R = require('ramda');
const {fulfill} = require('./fulfill');
const debug = require('debug')('botmaster:ware:fulfill');

// Utility functions for working with botmaster
const textLens = R.lensPath(['message', 'message', 'text']);
const defaultInput= R.view(textLens);
const defaultResponse = ({message, response}) => {
    message.message.text = response ? response.trim(' ') : '';
    return R.isEmpty(message.message.text) == false;
};

/**
 * Generate outgoing middleware for fulfill
 * @param  {Object} options.actions the actions to use
 * @param  {Function} [options.inputTransformer] a function that receives {bot, message, update} and returns the fulfill input
 * @param  {Function} [options.reponseTransformer] a function that receives (bot, message, update, reponse} updates the message
 * @param {Object} [options.params] an object of additional names to provide in params.
 * @return {function}         outgoing middleware
 */
const FulfillWare = options => (bot, update, message, next) => {
    debug(`fulfill received update: ${JSON.stringify(update)}`);
    const {
        actions = {},
        inputTransformer = defaultInput,
        reponseTransformer = defaultResponse,
        params = {}
    } = options;
    debug(`fulfill using actions: ${JSON.stringify(actions)}`);
    debug(`fulfill using as input: ${inputTransformer({bot, message})}`);
    params.bot = bot;
    params.update = update;
    params.message = message;
    fulfill(
        options.actions,
        params,
        inputTransformer({bot, update, message}),
        (error, response) => {
            const nonEmpty = reponseTransformer({message, response});
            if (nonEmpty) {
                next(error);
                debug(`fulfill sent new message: ${JSON.stringify(message)}`);
            } else {
                debug('no final update to send');
            }
        }
    );
};

module.exports = {
    FulfillWare
};
