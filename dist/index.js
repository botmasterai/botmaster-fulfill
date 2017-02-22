'use strict';

var _require = require('./fulfill'),
    fulfill = _require.fulfill,
    isPendingActions = _require.isPendingActions;

var _require2 = require('./FulfillWare'),
    FulfillWare = _require2.FulfillWare;

module.exports = {
    Outgoing: FulfillWare,
    fulfillOutgoingWare: FulfillWare,
    FulfillOutgoingWare: FulfillWare,
    outgoing: FulfillWare,
    FulfillWare: FulfillWare,
    fulfill: fulfill,
    isPendingActions: isPendingActions
};