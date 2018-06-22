'use strict';

/**
 *  Functions to find actions and evaluate them
 *  @private
 */

var R = require('ramda');

var _require = require('async'),
    nextTick = _require.nextTick;

var debug = require('debug')('botmaster:ware:fulfill:actions');
var _render = require('posthtml-render');

var _require2 = require('./utils'),
    Notifier = _require2.Notifier,
    unescapeMalformed = _require2.unescapeMalformed;

// ramda-style utils for procesing action arrays


var setName = function setName(val, key) {
    return R.set(R.lensProp('name'), key)(val);
};
var indexActionName = R.mapObjIndexed(setName);
var toArray = R.compose(R.values, indexActionName);
var checkArray = function checkArray(actions) {
    return Array.isArray(actions) ? actions : toArray(actions);
};
var actionApplies = function actionApplies(tree, action) {
    return R.find(R.propEq('tag', action.name), tree);
};
var getPendingActions = function getPendingActions(tree, actions) {
    return R.filter(R.curry(actionApplies)(tree), actions);
};
var mapToNames = R.map(R.prop('name'));
var getPendingActionNames = function getPendingActionNames(tree, actions) {
    return R.compose(mapToNames, R.curry(getPendingActions)(tree))(actions);
};
var isPendingActions = function isPendingActions(tree, actions) {
    return getPendingActionNames(tree, checkArray(actions)).length > 0;
};
var seriesActions = R.filter(R.prop('series'));
var parallelActions = R.filter(R.compose(R.not, R.prop('series')));
var isSync = R.allPass([function (x) {
    return !R.isNil(x);
}, R.anyPass([R.is(String), R.is(Number)])]);
var clearNodes = function clearNodes(start, end, tree) {
    return R.range(start, end).forEach(function (i) {
        tree[i] = '';
    });
};
var render = R.compose(unescapeMalformed, _render);

// get an object specifying serial and parallal tasks
var getTasks = function getTasks(tree, actions, context, fulfillPromise) {
    var tasks = evalActions(tree, actions, context);
    return {
        series: R.compose(R.map(createTask(tree, fulfillPromise)), seriesActions)(tasks),
        parallel: R.compose(R.map(createTask(tree, fulfillPromise)), parallelActions)(tasks)
    };
};

// create an async task by taking the "task" spec which specifies a certain action
var createTask = function createTask(tree, fulfillPromise) {
    return function (task) {
        return function (cb) {
            var typeNotifier = new Notifier();
            typeNotifier.promise.then(function (type) {
                return debug(task.name + ' controller based on its return type looks like a ' + type);
            });
            var callbackCalled = false;
            var internalCallback = function internalCallback(error, response) {
                if (!callbackCalled) {
                    callbackCalled = true;
                    debug(task.name + ' ' + task.index + ' got a response ' + response);
                    task.response = response || '';
                    if (task.evaluate == 'step') {
                        evalResponse(tree, task);
                        debug('tree is now ' + JSON.stringify(tree));
                    }
                    cb(error, task);
                } else {
                    debug('refusing to call callback twice.');
                }
            };
            var actionCallback = function actionCallback(err, response) {
                typeNotifier.promise.then(function (type) {
                    if (type == 'async' || err || response) {
                        internalCallback(err, response);
                        debug(task.name + ' called its callback, so is actually async');
                    }
                });
                return fulfillPromise;
            };

            var result = void 0,
                error = void 0;
            try {
                result = task.controller(task.params, actionCallback);
            } catch (err) {
                error = err;
                debug('error in ' + task.name + ': ' + err.message);
                nextTick(function () {
                    return cb(err);
                });
            }

            if (!error) {
                nextTick(function () {
                    if (result && typeof result.then == 'function' && result !== fulfillPromise) {
                        typeNotifier.complete('promise');
                        result.then(function (response) {
                            return internalCallback(null, response);
                        }).catch(internalCallback);
                    } else if (isSync(result)) {
                        typeNotifier.complete('sync');
                        nextTick(function () {
                            return internalCallback(null, result);
                        });
                    } else {
                        typeNotifier.complete('async');
                    }
                });
            }
        };
    };
};

var makeParams = function makeParams(index, el, tree, context) {
    var params = {
        attributes: el.attrs || {},
        tree: tree,
        get index() {
            return R.compose(R.findIndex(R.propEq('index', '' + index)), R.values(), R.filter(R.propEq('tag', el.tag)), // then filter for elements in the tree that are the same as the current one
            R.mapObjIndexed(function (val, key) {
                return R.set(R.lensProp('index'), key, val);
            }))(tree);
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
            return render(tree.filter(function (e) {
                return !e.tag;
            }));
        }
    };
    for (var prop in context) {
        params[prop] = context[prop];
    }
    return params;
};

// get a list of all action tags of a particular type along with their params
var evalActions = function evalActions(tree, actions, context) {
    var tasks = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];


    tree.forEach(function (el, index) {
        if (el && R.has(el.tag, actions)) tasks.push(R.merge(actions[el.tag], {
            params: makeParams(index, el, tree, context),
            index: index,
            name: el.tag,
            el: el
        }));
    });
    debug('Got ' + tasks.length + ' tasks');
    return tasks;
};

// update the tree the responses from a particular action
var evalResponse = function evalResponse(tree, task) {
    // check if another task modified this task
    if (!tree[task.index] || !tree[task.index].tag || tree[task.index].tag !== task.name) return tree[task.index];else if (typeof task.replace == 'function') task.replace(tree, task);else {
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
    getTasks: getTasks,
    isPendingActions: isPendingActions,
    evalResponse: evalResponse
};