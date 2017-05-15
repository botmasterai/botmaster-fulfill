'use strict';

var _require = require('../'),
    FulfillWare = _require.FulfillWare;

require('should');

var bot = {
    type: 'not a real bot'
};

describe('fulfill outgoing ware', function () {

    it('should say hello world!', function (done) {
        var actions = {
            hi: {
                controller: function controller() {
                    return 'hi world';
                }
            }
        };
        var ware = FulfillWare({
            actions: actions
        });
        var message = {
            message: {
                text: '<hi />'
            }
        };
        ware.controller(bot, {}, message, function (err) {
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
        var ware = FulfillWare({
            actions: actions
        });
        var message = {
            message: {
                text: '<hi />'
            }
        };
        ware.controller(bot, {}, message, function (err) {
            if (err) return done(err);
            done();
        });
    });

    it('should not conflict with outgoing messages not containing message.text (like attachments)', function (done) {
        var actions = {};
        var ware = FulfillWare({
            actions: actions
        });
        var message = {
            attachment: {}
        };
        ware.controller(bot, {}, message, function (err) {
            done(err);
        });
    });

    it('should not send empty messages', function (done) {
        var actions = {
            empty: {
                controller: function controller(params, next) {
                    next(null, '');
                }

            }
        };
        var ware = FulfillWare({
            actions: actions
        });
        var message = {
            message: {
                text: '<empty />'
            }
        };
        ware.controller(bot, {}, message, function (err) {
            err.should.eql('cancel');
            done();
        });
    });

    it('should not send messages consisting of spaces only', function (done) {
        var actions = {
            empty: {
                controller: function controller(params, next) {
                    next(null, '  ');
                }

            }
        };
        var ware = FulfillWare({
            actions: actions
        });
        var message = {
            message: {
                text: '<empty />'
            }
        };
        ware.controller(bot, {}, message, function (err) {
            err.should.eql('cancel');
            done();
        });
    });

    it('should work with the next syntax', function (done) {
        var actions = {
            HI: {
                controller: function controller(params, next) {
                    return next(null, 'HI').then(function () {});
                }
            }
        };
        var ware = FulfillWare({
            actions: actions
        });
        var message = {
            message: {
                text: '<HI />'
            }
        };
        ware.controller(bot, {}, message, function () {
            done();
        });
    });
});