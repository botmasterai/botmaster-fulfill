/**
 *  Main module for fulfill, defining the overall fulfill process
 *  @private
 */

const R = require('ramda');
const {parallel, series, apply} = require('async');
const {getTasks, isPendingActions:__isPendingActions, evalResponse } = require('./actions');
const __parse = require('posthtml-parser');
const render = require('posthtml-render');
const debug = require('debug')('botmaster:ware:fulfill:parse');
const {Notifier} = require('./utils');

const parseOptions = {
    xmlMode: true,
    recognizeSelfClosing: true,
    normalizeWhitespace: false,
    decodeEntities: false,
};

const parse = string => __parse(string, parseOptions);

/**
 * Test for remaining actions in a string
 * @param  {String}  string  input string to test for actions
 * @param  {Object}  actions actions to test for
 * @return {Boolean} whether any actions were found
 */
const isPendingActions = (string, actions) => __isPendingActions(parse(string), actions);


/**
 * Fulfill any actions found in the input text
 * @param  {Object} actions actions to run
 * @param  {Object} context an object of aditional properties to expost though `params`
 * @param  {String} input the string to look for actions in
 * @param  {Array}  [tree] provided as a way to speed up recursion. You probably don't need to use this and providing it without fulfillPromise (or vice versa) will cause an error.
 * @param  {Array}  [fulfillPromise] Used to let controllers know that fulfill has completed (or hit an error) even though this is a recursed function. You probably don't need to use this.
 * @param  {Function} cb error first callback
 */
const fulfill = (actions, context, input, tree, fulfillPromise, cb) => {
    if (!cb) {
        const notifier = new Notifier();
        cb = notifier.wrapCb(tree);
        fulfillPromise = notifier.promise;
        tree = parse(input);
    }
    debug(`Got tree ${JSON.stringify(tree)}`);
    const tasks = getTasks(tree, actions, context, fulfillPromise);
    debug(`Got ${tasks.parallel.length} parallel tasks and ${tasks.series.length} serial tasks`);
    parallel([
        apply(parallel, tasks.parallel),
        apply(series, tasks.series),
    ], (err, responses) => {
        if (err) {
            cb(err);
        }
        else {
            R.forEach(
                R.curry(evalResponse)(tree, R.__),
                R.compose(
                    R.filter(R.propSatisfies(evaluate => evaluate !== 'step', 'evaluate')),
                    R.flatten
                )(responses)
            );
            debug(`tree is now ${JSON.stringify(tree)}`);
            const response = render(tree);
            tree = parse(response);
            if (__isPendingActions(tree, actions)) {
                debug(`recursing response ${response}`);
                fulfill(actions, context, response, tree, fulfillPromise, cb);
            } else {
                debug(`final response ${response}`);
                cb(null, response);
                //accumulatedTasks.all.forEach(task => task.onFulfillError(err));
            }
        }
    });
};

module.exports = {
    fulfill,
    isPendingActions,
    Notifier
};
