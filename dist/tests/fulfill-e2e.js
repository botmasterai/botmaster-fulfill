'use strict';

var _require = require('../'),
    FulfillWare = _require.FulfillWare;

var _require2 = require('botmaster-test'),
    botmaster = _require2.botmaster,
    telegramMock = _require2.telegramMock,
    respond = _require2.respond,
    incomingUpdate = _require2.incomingUpdate,
    outgoingMessage = _require2.outgoingMessage;

describe('botmaster-fulfill', function () {
    var myBotmaster = void 0;
    var myTelegramMock = void 0;

    beforeEach(function () {
        return botmaster().then(function (botmaster) {
            myTelegramMock = telegramMock(botmaster);
            myBotmaster = botmaster;
        });
    });

    it('it should say hello world!', function (done) {
        myBotmaster.use('outgoing', FulfillWare({
            actions: {
                hi: {
                    controller: function controller() {
                        return 'hello world!!';
                    }
                }
            }
        }));
        respond(myBotmaster)('<hi />');
        myBotmaster.on('error', function (bot, error) {
            return done(new Error('botmaster error: ' + error));
        });
        myTelegramMock.expect(['hello world!!'], done).sendUpdate('hi bob', function (err) {
            if (err) done(new Error('supertest error: ' + err));
        });
    });

    describe('emitting messages', function () {
        it('it should handle ignoring tags', function (done) {
            myBotmaster.use('outgoing', FulfillWare({
                actions: {
                    ignore: {
                        controller: function controller() {
                            return '';
                        }
                    }
                }
            }));
            respond(myBotmaster)('<ignore />');
            myBotmaster.on('error', function (bot, error) {
                return done(new Error('botmaster error: ' + error));
            });
            myTelegramMock.expect([], done).sendUpdate('hi bob', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        });

        it('it should handle ignoring tags', function (done) {
            myBotmaster.use('outgoing', FulfillWare({
                actions: {
                    ignore: {
                        controller: function controller() {
                            return '';
                        }
                    }
                }
            }));
            respond(myBotmaster)('hi<ignore />');
            myBotmaster.on('error', function (bot, error) {
                return done(new Error('botmaster error: ' + error));
            });
            myTelegramMock.expect(['hi'], done).sendUpdate('hi bob', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        });

        it('it should send two messages', function (done) {
            myBotmaster.use('outgoing', FulfillWare({
                actions: {
                    send: {
                        controller: function controller(params) {
                            return params.bot.sendMessage(outgoingMessage(params.content)) && '';
                        }
                    }
                }
            }));
            respond(myBotmaster)('<send>hello...</send><send>there!</send>');
            myBotmaster.on('error', function (bot, error) {
                return done(new Error('botmaster error: ' + error));
            });
            myTelegramMock.expect(['hello...', 'there!'], done).sendUpdate('hi bob', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        });
    });

    describe('middleware specific params', function () {
        it('it should have the update that was sent', function (done) {
            myBotmaster.use('outgoing', FulfillWare({
                actions: {
                    send: {
                        controller: function controller(_ref) {
                            var update = _ref.update;

                            if (update.message.text == 'hi bob') return 'worked';else return 'did not work';
                        }
                    }
                }
            }));
            respond(myBotmaster)('<send></send>');
            myBotmaster.on('error', function (bot, error) {
                return done(new Error('botmaster error: ' + error));
            });
            myTelegramMock.expect(['worked'], done).sendUpdate('hi bob', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        });
        it('it should have the message that was sent', function (done) {
            myBotmaster.use('outgoing', FulfillWare({
                actions: {
                    send: {
                        controller: function controller(_ref2) {
                            var message = _ref2.message;

                            if (message.message.text == '<send></send>') return 'worked';else return 'did not work';
                        }
                    }
                }
            }));
            respond(myBotmaster)('<send></send>');
            myBotmaster.on('error', function (bot, error) {
                return done(new Error('botmaster error: ' + error));
            });
            myTelegramMock.expect(['worked'], done).sendUpdate('hi bob', function (err) {
                if (err) done(new Error('supertest error: ' + err));
            });
        });
    });
    afterEach(function (done) {
        this.retries(4);
        process.nextTick(function () {
            myTelegramMock.cleanAll();
            myBotmaster.server.close(done);
        });
    });
});