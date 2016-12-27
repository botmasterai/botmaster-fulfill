/**
 *  Functions to find actions and evaluate them
 */


const R = require('ramda');
const { nextTick} = require('async');
const {loadCheerio} = require('./cheerio');

// procesing action arrays
const setName = (val, key) => R.set(R.lensProp('name'), key)(val);
const indexActionName = R.mapObjIndexed(setName);
const toArray = R.compose(R.values, indexActionName);
const checkArray = actions => Array.isArray(actions) ? actions: toArray(actions);
const mergeActionAndTask = (actions, tasks) => R.map(
    task => R.merge(actions[task.name], task),
    tasks);

// utilities for evaluating pending actions
const actionApplies = ($, action) => $(action.name).length > 0;
const getPendingActions = ($, actions) => R.filter(R.curry(actionApplies)($), actions);
const mapToNames = R.map(R.prop('name'));
//const indexByName = R.indexBy(R.prop('name'));
const getPendingActionNames = ($, actions) => R.compose(mapToNames, R.curry(getPendingActions)($))(actions);
const isPendingActions = ($, actions) => getPendingActionNames($, checkArray(actions)).length > 0;
const getPendingActionSelectors = ($, actions) => R.compose(R.join(', '), R.curry(getPendingActionNames)($))(actions);

// Filter functions to find actions that are parallel or series
const seriesActions = R.filter(R.prop('series'));
const parallelActions = R.filter(R.compose(R.not, R.prop('series')));

// tests to find out if an action controller returns a promise, is snychronous or is async callback style
//const isPromise = action => typeof action.controller.then == 'function';
//const isSync = action => !isPromise(action) && action.controller.length <= 1;
//const isAsync = action => !isPromise(action) && action.controller.length > 1;

// get a list of all action tags of a particular type along with their params
const defaultToString = R.defaultTo('');
const evalAction = ($, actionSelector) => {
    const actionParams = [];
    $(actionSelector).each( (i, el) => {
        console.log(el)
        const elXml = $(el);
        //console.log(elXml[0])
        //console.log(elXml[0].nextSibling)
        //console.log(elXml[0].tagName)
        //console.log(el)
        //console.log(elXml[0].previousSibling)
        //const after = $(el).parent().children().filter( index => index > i).html();
        actionParams.push({
            params: {
                attributes: elXml.attr(),
                content: elXml.html()
                //before: R.compose(R.trim, defaultToString, R.path(['prev', 'data']))(el),
                //after: R.compose(R.trim, defaultToString, R.path(['next', 'data']))(el)
            },
            name: el.name,
            el: elXml
        });
    });
    console.log(R.map(R.path(['params', 'after']), actionParams));
    console.log(`Got tasks: ${actionParams} using selector: $('${actionSelector}')`);
    return actionParams;
};

// make a list of all actions to perform in the order that they appear and add params
const getActionParams = ($, actions) => R.compose(
    R.curry(mergeActionAndTask)(actions), // return full task array
    R.curry(evalAction)($), // get the parameters
    R.curry(getPendingActionSelectors)($), // only look for pending actions
    toArray // operate on an array rather than object
)(actions);

// divde a result into response and (new) messages using
// an array-like api and evaluating for further actions
const getResponseAndMessagesFromResult = (task, actions, result) => {
    let response;
    let messages;
    if (Array.isArray(result) && result.length > 0) {
        if  (R.compose(R.not, isPendingActions, loadCheerio(result[0]))(actions))
            response = result.pop();
        messages = result;

    } else {
        if (R.compose(isPendingActions, loadCheerio(result))(actions))
            messages = [result];
        else
            response = result;
    }
    return R.merge(task, {response, messages});
};

// action a particular task, returning {response, message}
const actionTask = (context, $) => task => cb => {
    task.params.context = context;
    const internalCallback = (error, response) => {
        task.response = response || '';
        evalResponse($, task);
        cb(error, task);
    };
    try {
        const result = task.controller(task.params, internalCallback);
        if (typeof result.then == 'function') {
            result.then( response =>
                internalCallback(null, response)
            ).catch( error =>
                internalCallback(error)
            );
        } else if (! R.isNil(result) ) {
            nextTick( () => internalCallback(null, result) );
        }
    } catch (err) {
        nextTick( () => cb(err) );
    }
};


// get an object specifying serial and parallal tasks and their async task and promise subtypes
const getTasks = ($, actions, context, response) => {
    const tasks = getActionParams($, actions, context, response);
    //console.log(`evaluated tasks: ${JSON.stringify(tasks)}`);
    return {
        series: R.compose(R.map(actionTask(context, $)), seriesActions)(tasks),
        parallel: R.compose(R.map(actionTask(context, $)), parallelActions)(tasks)
    };
};

// update the cheerio object with the responses from a particular action
const evalResponse = ($, task) => {
    if (task.replace == 'adjacent') {
        $(task.el.prev).remove();
        $(task.el.next).remove();
        task.el.replaceWith(task.response);
    } else if (typeof task.replace == 'function')
        task.replace($, task);
    else {
        task.el.replaceWith(task.response);
    }
};

module.exports = {
    getTasks,
    evalResponse, // or evalActions?
    isPendingActions
};
