'use strict';

/**
 *  Main module for fulfill, defining the overall fulfill process
 *  @private
 */

var R = require('ramda');

var _require = require('async'),
    parallel = _require.parallel,
    series = _require.series,
    apply = _require.apply;

var _require2 = require('./actions'),
    getTasks = _require2.getTasks,
    __isPendingActions = _require2.isPendingActions,
    evalResponse = _require2.evalResponse;

var __parse = require('posthtml-parser');
var render = require('posthtml-render');
var debug = require('debug')('botmaster:ware:fulfill:parse');

var parseOptions = {
    xmlMode: true,
    recognizeSelfClosing: true,
    normalizeWhitespace: false,
    decodeEntities: false
};

var parse = function parse(string) {
    return __parse(string, parseOptions);
};

/**
 * Test for remaining actions in a string
 * @param  {String}  string  input string to test for actions
 * @param  {Object}  actions actions to test for
 * @return {Boolean} whether any actions were found
 */
var isPendingActions = function isPendingActions(string, actions) {
    return __isPendingActions(parse(string), actions);
};

/**
 * Fulfill any actions found in the input text
 * @param  {Object} actions actions to run
 * @param  {Object} context an object of aditional properties to expost though `params`
 * @param  {String} input the string to look for actions in
 * @param  {Array}  [tree] provided as a way to speed up recursion. You probably don't need to use this.
 * @param  {Function} cb error first callback
 */
var fulfill = function fulfill(actions, context, input, tree, cb) {
    if (!cb) {
        cb = tree;
        tree = parse(input);
    }
    debug('Got tree ' + JSON.stringify(tree));
    var tasks = getTasks(tree, actions, context);
    debug('Got ' + tasks.parallel.length + ' parallel tasks and ' + tasks.series.length + ' serial tasks');
    parallel([apply(parallel, tasks.parallel), apply(series, tasks.series)], function (err, responses) {
        if (err) cb(err);else {
            R.forEach(R.curry(evalResponse)(tree, R.__), R.compose(R.filter(R.propSatisfies(function (evaluate) {
                return evaluate !== 'step';
            }, 'evaluate')), R.flatten)(responses));
            debug('tree is now ' + JSON.stringify(tree));
            var response = render(tree);
            tree = parse(response);
            if (__isPendingActions(tree, actions)) {
                debug('recursing response ' + response);
                fulfill(actions, context, response, tree, cb);
            } else {
                debug('final response ' + response);
                cb(null, response);
            }
        }
    });
};

module.exports = {
    fulfill: fulfill,
    isPendingActions: isPendingActions
};