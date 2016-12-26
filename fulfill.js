/**
 * main module for fulfill, defining the overall fulfill process
 */

const {parallel, series, apply} = require('async');
const { loadCheerio } = require('./cheerio');
const { getTasks, isPendingActions } = require('./actions');

const fulfill = (actions, context, input, cb) => {
    const $ = loadCheerio(input);
    const tasks = getTasks($, actions, context, input);
    parallel({
        parallel: apply(parallel, tasks.parallel),
        series: apply(series, tasks.series),
    }, err => {
        const response = $.html();
        if (err)
            cb(err);
        else if (isPendingActions($, actions)) {
            fulfill(actions, context,response, cb);
        } else
            cb(null, response);
    });
};

module.exports = {
    fulfill
};
