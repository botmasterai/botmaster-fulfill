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
var defaultInput = R.view(textLens);
var defaultResponse = function defaultResponse(_ref) {
    var message = _ref.message,
        response = _ref.response,
        next = _ref.next;

    if (!response || typeof response !== 'string') return debug('no response, not calling next');

    var trimmedResponse = response.trim(' ');
    if (R.isEmpty(trimmedResponse)) return debug('no final message after trimming, not calling next');

    message.message.text = trimmedResponse;
    next();
    debug('fulfill sent new message: ' + JSON.stringify(message));
};

/**
 * Generate outgoing middleware for fulfill
 * @param  {Object} options.actions the actions to use
 * @param  {Function} [options.inputTransformer] a function that receives {bot, message, update} and returns the fulfill input
 * @param  {Function} [options.reponseTransformer] a function that receives {bot, message, update, response, next} updates the message and calls next.
 * @param {Object} [options.params] an object of additional names to provide in params.
 * @return {function}         outgoing middleware
 */
var FulfillWare = function FulfillWare(options) {
    return function (bot, update, message, next) {
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
        params.bot = bot;
        params.update = update;
        params.message = message;
        fulfill(options.actions, params, inputTransformer({ bot: bot, update: update, message: message }), function (error, response) {
            if (!error) reponseTransformer({ bot: bot, message: message, update: update, response: response, next: next });else next(error);
        });
    };
};

module.exports = {
    FulfillWare: FulfillWare
};