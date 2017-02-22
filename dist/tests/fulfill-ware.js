'use strict';

var _require = require('../'),
    FulfillWare = _require.FulfillWare;

require('should');

describe('fulfill outgoing ware', function () {

    it('should say hello world!', function (done) {
        var actions = {
            hi: {
                controller: function controller() {
                    return 'hi world';
                }
            }
        };
        var ware = FulfillWare({ actions: actions });
        var message = { message: { text: '<hi />' } };
        var bot = { type: 'not a real bot' };
        ware(bot, {}, message, function (err) {
            if (err) return done(err);
            message.message.text.should.equal('hi world');
            done();
        });
    });

    it('should have bot in params', function (done) {
        var actions = {
            hi: {
                controller: function controller(params) {
                    if (!params.bot) throw new Error('no bot!');
                    if (params.context) throw new Error('why do you still have context');
                    params.bot.type.should.equal('not a real bot');
                    return 'bo';
                }
            }
        };
        var ware = FulfillWare({ actions: actions });
        var message = { message: { text: '<hi />' } };
        var bot = { type: 'not a real bot' };
        ware(bot, {}, message, function (err) {
            if (err) return done(err);
            done();
        });
    });
});