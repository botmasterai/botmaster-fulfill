/**
 *  Entry point to fulfill. Export function to generate botmaster outoing middleware as well as raw fulfill function
 */

const {fulfill, isPendingActions} = require('./fulfill');
const {FulfillOutgoingWare} = require('./fulfill-outgoing-ware');

module.exports = {
    Outgoing: FulfillOutgoingWare,
    FulfillOutgoingWare,
    fulfill,
    isPendingActions
};
