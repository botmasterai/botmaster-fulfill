/**
 *  Functions to find actions and evaluate them
 *  @private
 */

const R = require('ramda');
const { nextTick} = require('async');
const debug = require('debug')('botmaster:ware:fulfill:actions');
const render = require('posthtml-render');
const {Notifier} = require('./utils');

// ramda-style utils for procesing action arrays
const setName = (val, key) => R.set(R.lensProp('name'), key)(val);
const indexActionName = R.mapObjIndexed(setName);
const toArray = R.compose(R.values, indexActionName);
const checkArray = actions => Array.isArray(actions) ? actions: toArray(actions);
const actionApplies = (tree, action) => R.find(R.propEq('tag', action.name), tree);
const getPendingActions = (tree, actions) => R.filter(R.curry(actionApplies)(tree), actions);
const mapToNames = R.map(R.prop('name'));
const getPendingActionNames = (tree, actions) => R.compose(mapToNames, R.curry(getPendingActions)(tree))(actions);
const isPendingActions = (tree, actions) => getPendingActionNames(tree, checkArray(actions)).length > 0;
const seriesActions = R.filter(R.prop('series'));
const parallelActions = R.filter(R.compose(R.not, R.prop('series')));
const isSync = R.allPass([x => !R.isNil(x), R.anyPass([R.is(String), R.is(Number)])]);
const clearNodes = (start, end, tree) => R.range(start, end).forEach(i => { tree[i] = '';});

// get an object specifying serial and parallal tasks
const getTasks = (tree, actions, context, fulfillPromise) => {
    const tasks = evalActions(tree, actions, context);
    return {
        series: R.compose(R.map(createTask(tree, fulfillPromise)), seriesActions)(tasks),
        parallel: R.compose(R.map(createTask(tree, fulfillPromise)), parallelActions)(tasks)
    };
};


// create an async task by taking the "task" spec which specifies a certain action
const createTask = (tree, fulfillPromise) => task => cb => {
    const typeNotifier = new Notifier();
    typeNotifier.promise.then(type => debug(`${task.name} controller based on its return type looks like a ${type}`));
    let callbackCalled = false;
    const internalCallback = (error, response) => {
        if (!callbackCalled) {
            callbackCalled = true;
            debug(`${task.name} ${task.index} got a response ${response}`);
            task.response = response || '';
            if (task.evaluate == 'step') {
                evalResponse(tree, task);
                debug(`tree is now ${JSON.stringify(tree)}`);
            }
            cb(error, task);
        } else {
            debug('refusing to call callback twice.');
        }
    };
    const actionCallback = (err, response) => {
        typeNotifier.promise.then(type => {
            if (type == 'async' || err || response) {
                internalCallback(err, response);
                debug(`${task.name} called its callback, so is actually async`);
            }
        });
        return fulfillPromise;
    };

    let result, error;
    try {
        result = task.controller(task.params, actionCallback);
    } catch (err) {
        error = err;
        debug (`error in ${task.name}: ${err.message}`);
        nextTick( () => cb(err) );
    }

    if (!error) {
        nextTick(() => {
            if (result && typeof result.then == 'function' && result !== fulfillPromise) {
                typeNotifier.complete('promise');
                result
                    .then( response => internalCallback(null, response))
                    .catch( internalCallback );
            } else if (isSync(result)) {
                typeNotifier.complete('sync');
                nextTick( () => internalCallback(null, result) );
            } else {
                typeNotifier.complete('async');
            }
        });
    }
};

const makeParams = (index, el, tree, context) => {
    const params = {
        attributes: el.attrs || {},
        tree: tree,
        get index() {
            return R.compose(
                R.findIndex(R.propEq('index', ''+index)),
                R.values(),
                R.filter(R.propEq('tag', el.tag)), // then filter for elements in the tree that are the same as the current one
                R.mapObjIndexed((val, key) => R.set(R.lensProp('index'), key, val))
            )(tree);
        },
        get tag() {
            return render(el);
        },
        get content() {
            return render(el.content);
        },
        get before() {
            return render(tree.slice(0, index));
        },
        get after() {
            return render(tree.slice(index + 1));
        },
        get all() {
            return render(tree.filter(e => !e.tag));
        }
    };
    for (let prop in context) {
        params[prop] = context[prop];
    }
    return params;
};

// get a list of all action tags of a particular type along with their params
const evalActions = (tree, actions, context, tasks = []) => {

    tree.forEach( (el, index) => {
        if (el && R.has(el.tag, actions))
            tasks.push(R.merge(
                actions[el.tag],
                {
                    params: makeParams(index, el, tree, context),
                    index,
                    name: el.tag,
                    el
                })
            );
    });
    debug(`Got ${tasks.length} tasks`);
    return tasks;
};


// update the tree the responses from a particular action
const evalResponse = (tree, task) => {
    // check if another task modified this task
    if (! tree[task.index] || ! tree[task.index].tag || tree[task.index].tag !== task.name)
        return tree[task.index];
    else if (typeof task.replace == 'function')
        task.replace(tree, task);
    else {
        switch (task.replace) {
            case 'before':
                clearNodes(0, task.index, tree);
                tree[task.index] = task.response;
                break;
            case 'after':
                clearNodes(task.index, tree.length, tree);
                tree[task.index] = task.response;
                break;
            case 'all':
                tree.length = 0;
                tree[0] = task.response;
                break;
            default:
                tree[task.index] = task.response;

        }
    }
};




module.exports = {
    getTasks,
    isPendingActions,
    evalResponse
};
