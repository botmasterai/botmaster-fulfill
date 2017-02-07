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
