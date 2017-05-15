/**
 *  Botmaster middleware generating function to connect fulfill to botmaster as outgoing middleware.
 *  @private
 */

const R = require('ramda');
const {fulfill} = require('./fulfill');
const debug = require('debug')('botmaster:ware:fulfill');

// Utility functions for working with botmaster
const textLens = R.lensPath(['message', 'message', 'text']);

/**
 * Default function to extraxt input for fulfill from botmaster context. Uses simply message.message.text. If it does not exist then fulfill does not run.
 * @param  {Object} $0 context object consisting of botmaster objects and next
 * @param {Object} $0.message the botmaster message
 */
const defaultInput= R.view(textLens);

/**
 * Default function to update botmaster middleware context with fulfill response and call next. It only sets message.message.text if the response is a non empty string after trimming. Otherwise it calls next with "cancels" which cancels  the outgoing message.
 * @param  {Object}   $0 context object consisting of botmaster objects, fulfill response, and next
 * @param  {Object}   $0.message botmaster message
 * @param  {Function} $0.next next function from botmaster outgoing middleware
 * @param  {String}   $0.response respopnse from fulfill
 */
const defaultResponse = ({message, response, next}) => {
    if (! response || typeof response !== 'string')
        return next('cancel');

    const trimmedResponse = response.trim(' ');
    if (R.isEmpty(trimmedResponse))
        return next('cancel');

    message.message.text = trimmedResponse;
    next();
    debug(`fulfill sent new message: ${JSON.stringify(message)}`);
};

/**
 * Generate outgoing middleware for fulfill
 * @param  {Object} options options
 * @param  {Object} options.actions the actions to use
 * @param  {Function} [options.inputTransformer] a function that receives {bot, message, update} and returns the fulfill input or a falsy value to skip running fulfill.
 * @param  {Function} [options.reponseTransformer] a function that receives ({bot, message, update, response, next}) updates the message and calls next.
 * @param {Object} [options.params] an object of additional names to provide in params.
 * @return {function}   outgoing middleware
 */
const FulfillWare = options => {
    return {
        type: 'outgoing',
        name: 'fulfillWare',
        controller: (bot, update, message, next) => {
            debug(`fulfill received message: ${JSON.stringify(message)}`);
            const {
                actions = {},
                inputTransformer = defaultInput,
                reponseTransformer = defaultResponse,
                params = {}
            } = options;
            debug(`fulfill using actions: ${JSON.stringify(actions)}`);
            debug(`fulfill using as input: ${inputTransformer({bot, message})}`);
            const input = inputTransformer({bot, update, message});
            if (input) {
                params.bot = bot;
                params.update = update;
                params.message = message;
                fulfill(
                    options.actions,
                    params,
                    input,
                    (error, response) => {
                        if (!error)
                            reponseTransformer({bot, message, update, response, next});
                        else
                            next(error);
                    }
                );
            } else {
                next();
            }
        }
    };
};

module.exports = {
    FulfillWare
};
