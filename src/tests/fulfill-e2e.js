const {FulfillWare} = require('../');
const {
    botmaster,
    telegramMock,
    respond,
    incomingUpdate,
    outgoingMessage
} = require('botmaster-test');

describe('botmaster-fulfill', () => {
    let myBotmaster;
    let myTelegramMock;

    beforeEach(() => botmaster().then(botmaster => {
        myTelegramMock = telegramMock(botmaster);
        myBotmaster = botmaster;
    }));

    it('it should say hello world!', done => {
        myBotmaster.use('outgoing', FulfillWare({
            actions: {
                hi: {
                    controller: () => 'hello world!!'
                }
            }
        }));
        respond(myBotmaster)('<hi />');
        myBotmaster.on('error', (bot, error) => done(new Error(`botmaster error: ${error}`)));
        myTelegramMock
            .expect(['hello world!!'], done)
            .sendUpdate('hi bob', err => {
                if (err) done(new Error('supertest error: ' + err));
            });

    });

    describe('emitting messages', () => {
        it('it should send two messages', done => {
            myBotmaster.use('outgoing', FulfillWare({
                actions: {
                    send: {
                        controller: params => params.bot
                            .sendMessage(outgoingMessage(params.content)) && ''
                    }
                }
            }));
            respond(myBotmaster)('<send>hello...</send><send>there!</send>');
            myBotmaster.on('error', (bot, error) => done(new Error(`botmaster error: ${error}`)));
            myTelegramMock
                .expect(['hello...', 'there!'], done)
                .sendUpdate('hi bob', err => {
                    if (err) done(new Error('supertest error: ' + err));
                });
        });



    });

    describe('middleware specific params', () => {
        it('it should have the update that was sent', done => {
            myBotmaster.use('outgoing', FulfillWare({
                actions: {
                    send: {
                        controller: ({update}) => {
                            if (update.message.text == 'hi bob')
                                return 'worked';
                            else
                                return 'did not work';
                        }
                    }
                }
            }));
            respond(myBotmaster)('<send></send>');
            myBotmaster.on('error', (bot, error) => done(new Error(`botmaster error: ${error}`)));
            myTelegramMock
                .expect(['worked'], done)
                .sendUpdate('hi bob', err => {
                    if (err) done(new Error('supertest error: ' + err));
                });
        });
        it('it should have the message that was sent', done => {
            myBotmaster.use('outgoing', FulfillWare({
                actions: {
                    send: {
                        controller: ({message})=> {
                            if (message.message.text == '<send></send>')
                                return 'worked';
                            else
                                return 'did not work';
                        }
                    }
                }
            }));
            respond(myBotmaster)('<send></send>');
            myBotmaster.on('error', (bot, error) => done(new Error(`botmaster error: ${error}`)));
            myTelegramMock
                .expect(['worked'], done)
                .sendUpdate('hi bob', err => {
                    if (err) done(new Error('supertest error: ' + err));
                });
        });
    });
    afterEach(function(done) {
        this.retries(4);
        process.nextTick(() => {
            myTelegramMock.cleanAll();
            myBotmaster.server.close(done);
        });
    });
});
