/**
 * main module for fulfill, defining the overall fulfill process
 */

const {parallel, series, apply} = require('async');
const {getTasks, isPendingActions } = require('./actions');
const parse = require('posthtml-parser');
const render = require('posthtml-render');
const debug = require('debug')('botmaster:fulfill');

const parseOptions = {
    xmlMode: true,
    recognizeSelfClosing: true,
    normalizeWhitespace: false,
    decodeEntities: false,
};

const fulfill = (actions, context, input, tree, cb) => {
    if (!cb) {
        cb = tree;
        tree = parse(input, parseOptions);
    }
    debug(`Got tree ${JSON.stringify(tree)}`);
    const tasks = getTasks(tree, actions, context);
    debug(`Got ${tasks.parallel.length} parallel tasks and ${tasks.series.length} serial tasks`);
    parallel({
        parallel: apply(parallel, tasks.parallel),
        series: apply(series, tasks.series),
    }, err => {
        if (err) cb(err);
        else {
            const response = render(tree);
            tree = parse(response, parseOptions);
            if (isPendingActions(tree, actions)) {
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
    fulfill
};
