/**
 *  Functions to find actions and evaluate them
 */

const R = require('ramda');
const { nextTick} = require('async');
const {loadCheerio} = require('./cheerio');
const debug = require('debug')('botmaster:fulfill:actions');

// ramda-style utils for procesing action arrays
const defaultToString = R.defaultTo('');
const cleanString = R.compose(R.trim, defaultToString);
const setName = (val, key) => R.set(R.lensProp('name'), key)(val);
const indexActionName = R.mapObjIndexed(setName);
const toArray = R.compose(R.values, indexActionName);
const checkArray = actions => Array.isArray(actions) ? actions: toArray(actions);
const actionApplies = ($, action) => $(action.name).length > 0;
const getPendingActions = ($, actions) => R.filter(R.curry(actionApplies)($), actions);
const mapToNames = R.map(R.prop('name'));
const getPendingActionNames = ($, actions) => R.compose(mapToNames, R.curry(getPendingActions)($))(actions);
const isPendingActions = ($, actions) => getPendingActionNames($, checkArray(actions)).length > 0;
const getPendingActionSelectors = ($, actions) => R.compose(R.join(', '), R.curry(getPendingActionNames)($))(actions);
const seriesActions = R.filter(R.prop('series'));
const parallelActions = R.filter(R.compose(R.not, R.prop('series')));
const isSync = R.allPass([x => !R.isNil(x), R.anyPass([R.is(String), R.is(Number)])]);
const mergeActionAndTask = (actions, tasks) => R.map(
    task => R.merge(actions[task.name], task),
    tasks);

// remove text nodes in cheerio object in place
const clearTextRecurse = (position, el, recurse=true) => {
    if (el[position]) {
        if (el[position].data) el[position].data= '';
        if (recurse) clearTextRecurse(position, el[position]);
    }
};
const clearText = R.curry(clearTextRecurse)(R.__, R.__, false);

// get a list of all action tags of a particular type along with their params
const evalAction = ($, actionSelector) => {
    const actionParams = [];
    $(actionSelector).each( (i, el) => {
        const elXml = $(el);
        actionParams.push({
            params: {
                get attributes () {
                    return elXml.attr();
                },
                get content() {
                    return elXml.html();
                },
                get before() {
                    return R.compose(cleanString, R.path(['prev', 'data']))(el);
                },
                get beforeAll() {
                    const $2 = loadCheerio($.html());
                    const el2 = $2(actionSelector).eq(i)[0];
                    clearTextRecurse('next', el2);
                    $2(actionSelector).eq(i).nextAll().remove();
                    $2(actionSelector).eq(i).remove();
                    return $2.html();
                },
                get after() {
                    return R.compose(cleanString, R.path(['prev', 'data']))(el);
                },
                get afterAll() {
                    const $2 = loadCheerio($.html());
                    const el2 = $2(actionSelector).eq(i)[0];
                    clearTextRecurse('prev', el2);
                    $2(actionSelector).prevAll().remove();
                    $2(actionSelector).remove();
                    return $2.html();
                }
            },
            name: el.name,
            el: elXml
        });
    });
    debug(`Got ${actionParams.length} tasks using selector: $('${actionSelector}')`);
    return actionParams;
};

// make a list of all actions to perform in the order that they appear and add params
const getActionParams = ($, actions) => R.compose(
    R.curry(mergeActionAndTask)(actions), // return full task array
    R.curry(evalAction)($), // get the parameters
    R.curry(getPendingActionSelectors)($), // only look for pending actions
    toArray // operate on an array rather than object
)(actions);



// update the cheerio object with the responses from a particular action
const evalResponse = ($, task) => {
    if (typeof task.replace == 'function')
        task.replace($, task);
    else {
        switch (task.replace) {
            case 'beforeAll':
                $(task.el).prevAll().remove();
                clearTextRecurse('prev', task.el[0]);
                break;
            case 'before':
                clearText('prev', task.el[0]);
                break;
            case 'afterAll':
                $(task.el).nextAll().remove();
                clearTextRecurse('next', task.el[0]);
                break;
            case 'after':
                clearText('next', task.el[0]);
                break;
            case 'adjacent':
                clearText('prev', task.el[0]);
                clearText('next', task.el[0]);
                break;
        }
        task.el.replaceWith(task.response);
    }
};

// create a async an async task by taking the "task" spec which specifies a certain action
const actionTask = (context, $) => task => cb => {
    task.params.context = context;
    const internalCallback = (error, response) => {
        task.response = response || '';
        evalResponse($, task);
        return cb(error, task);
    };
    try {
        const result = task.controller(task.params, internalCallback);
        if (result && typeof result.then == 'function') {
            debug(`${task.name} controller is a promise`);
            result
                .then( response => internalCallback(null, response))
                .catch( internalCallback );
        } else if (isSync(result)) {
            debug(`${task.name} controller is sync`);
            nextTick( () => internalCallback(null, result) );
        } else {
            debug(`${task.name} controller is async`);
        }
    } catch (err) {
        nextTick( () => cb(err) );
    }
};

// get an object specifying serial and parallal tasks and their async task and promise subtypes
const getTasks = ($, actions, context, response) => {
    const tasks = getActionParams($, actions, context, response);
    return {
        series: R.compose(R.map(actionTask(context, $)), seriesActions)(tasks),
        parallel: R.compose(R.map(actionTask(context, $)), parallelActions)(tasks)
    };
};

module.exports = {
    getTasks,
    isPendingActions
};
