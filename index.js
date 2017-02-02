/**
 *  Entry point to fulfill. Export function to generate botmaster outoing middleware as well as raw fulfill function
 */

const {fulfill, isPendingActions} = require('./fulfill');
const {FulfillWare} = require('./FulfillWare');

module.exports = {
    Outgoing: FulfillWare,
    fulfillOutgoingWare: FulfillWare,
    FulfillOutgoingWare: FulfillWare,
    outgoing: FulfillWare,
    FulfillWare,
    fulfill,
    isPendingActions
};
