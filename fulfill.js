/**
 * main module for fulfill, defining the overall fulfill process
 */

const R = require('ramda');
const {parallel, series, apply} = require('async');
const {getTasks, isPendingActions:__isPendingActions, evalResponse } = require('./actions');
const __parse = require('posthtml-parser');
const render = require('posthtml-render');
const debug = require('debug')('botmaster:ware:fulfill:parse');

const parseOptions = {
    xmlMode: true,
    recognizeSelfClosing: true,
    normalizeWhitespace: false,
    decodeEntities: false,
};

const parse = string => __parse(string, parseOptions);
const isPendingActions = (string, actions) => __isPendingActions(parse(string), actions);

const fulfill = (actions, context, input, tree, cb) => {
    if (!cb) {
        cb = tree;
        tree = parse(input);
    }
    debug(`Got tree ${JSON.stringify(tree)}`);
    const tasks = getTasks(tree, actions, context);
    debug(`Got ${tasks.parallel.length} parallel tasks and ${tasks.series.length} serial tasks`);
    parallel([
        apply(parallel, tasks.parallel),
        apply(series, tasks.series),
    ], (err, responses) => {
        if (err) cb(err);
        else {
            R.map(R.curry(evalResponse)(tree, R.__), R.flatten(responses));
            debug(`tree is now ${JSON.stringify(tree)}`);
            const response = render(tree);
            tree = parse(response);
            if (__isPendingActions(tree, actions)) {
                debug(`recursing response ${response}`);
                fulfill(actions, context, response, tree, cb);
            } else {
                debug(`final response ${response}`);
                cb(null, response);
            }
        }
    });
};

module.exports = {
    fulfill,
    isPendingActions
};
