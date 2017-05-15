'use strict';

/**
 *  Botmaster middleware generating function to connect fulfill to botmaster as outgoing middleware.
 *  @private
 */

var R = require('ramda');

var _require = require('./fulfill'),
    fulfill = _require.fulfill;

var debug = require('debug')('botmaster:ware:fulfill');

// Utility functions for working with botmaster
var textLens = R.lensPath(['message', 'message', 'text']);

/**
 * Default function to extraxt input for fulfill from botmaster context. Uses simply message.message.text. If it does not exist then fulfill does not run.
 * @param  {Object} $0 context object consisting of botmaster objects and next
 * @param {Object} $0.message the botmaster message
 */
var defaultInput = R.view(textLens);

/**
 * Default function to update botmaster middleware context with fulfill response and call next. It only sets message.message.text if the response is a non empty string after trimming. Otherwise it calls next with "cancels" which cancels  the outgoing message.
 * @param  {Object}   $0 context object consisting of botmaster objects, fulfill response, and next
 * @param  {Object}   $0.message botmaster message
 * @param  {Function} $0.next next function from botmaster outgoing middleware
 * @param  {String}   $0.response respopnse from fulfill
 */
var defaultResponse = function defaultResponse(_ref) {
    var message = _ref.message,
        response = _ref.response,
        next = _ref.next;

    if (!response || typeof response !== 'string') return next('cancel');

    var trimmedResponse = response.trim(' ');
    if (R.isEmpty(trimmedResponse)) return next('cancel');

    message.message.text = trimmedResponse;
    next();
    debug('fulfill sent new message: ' + JSON.stringify(message));
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
var FulfillWare = function FulfillWare(options) {
    return {
        type: 'outgoing',
        name: 'fulfillWare',
        controller: function controller(bot, update, message, next) {
            debug('fulfill received message: ' + JSON.stringify(message));
            var _options$actions = options.actions,
                actions = _options$actions === undefined ? {} : _options$actions,
                _options$inputTransfo = options.inputTransformer,
                inputTransformer = _options$inputTransfo === undefined ? defaultInput : _options$inputTransfo,
                _options$reponseTrans = options.reponseTransformer,
                reponseTransformer = _options$reponseTrans === undefined ? defaultResponse : _options$reponseTrans,
                _options$params = options.params,
                params = _options$params === undefined ? {} : _options$params;

            debug('fulfill using actions: ' + JSON.stringify(actions));
            debug('fulfill using as input: ' + inputTransformer({ bot: bot, message: message }));
            var input = inputTransformer({ bot: bot, update: update, message: message });
            if (input) {
                params.bot = bot;
                params.update = update;
                params.message = message;
                fulfill(options.actions, params, input, function (error, response) {
                    if (!error) reponseTransformer({ bot: bot, message: message, update: update, response: response, next: next });else next(error);
                });
            } else {
                next();
            }
        }
    };
};

module.exports = {
    FulfillWare: FulfillWare
};