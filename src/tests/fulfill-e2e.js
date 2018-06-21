const {FulfillWare} = require('../');
const {
    botmaster,
    telegramMock,
    respond,
    outgoingMessage
} = require('botmaster-test');

describe('botmaster fulfill end to end', () => {
    let myBotmaster;
    let myTelegramMock;

    beforeEach(() => botmaster().then(botmaster => {
        myTelegramMock = telegramMock(botmaster);
        myBotmaster = botmaster;
    }));

    it('it should say hello world!', done => {
        myBotmaster.use(FulfillWare({
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
        it('it should handle ignore type actions', done => {
            myBotmaster.use(FulfillWare({
                actions: {
                    ignore: {
                        controller: () => ''
                    }
                }
            }));
            respond(myBotmaster)('hi<ignore />');
            myBotmaster.on('error', (bot, error) => done(new Error(`botmaster error: ${error}`)));
            myTelegramMock
                .expect(['hi'], done)
                .sendUpdate('hi bob', err => {
                    if (err) done(new Error('supertest error: ' + err));
                });
        });

        it('it should handle ignoring tags', done => {
            myBotmaster.use(FulfillWare({
                actions: {
                    ignore: {
                        controller: () => ''
                    }
                }
            }));
            respond(myBotmaster)('<notYourTag /><somethingInXml>{\"url\": \"https:/example.com\"}</somethingInXml>hi<ignore />');
            myBotmaster.on('error', (bot, error) => done(new Error(`botmaster error: ${error}`)));
            myTelegramMock
                .expect([`<notYourTag></notYourTag><somethingInXml>{\\\\\\"url\\\\\\": \\\\\\"https:/example.com\\\\\\"}</somethingInXml>hi\\\\\\"}`], done)
                .sendUpdate('hi bob', err => {
                    if (err) done(new Error('supertest error: ' + err));
                });
        });

        it('it should send two messages', done => {
            myBotmaster.use(FulfillWare({
                actions: {
                    send: {
                        controller: params => params.bot
                            .sendMessage(outgoingMessage(params.content)) && ''
                    }
                }
            }));
            respond(myBotmaster)('<send>hello...</send><send>there!</send>');
            myBotmaster.on('error', (bot, error) => console.log(error) || done(new Error(`botmaster error: ${error}`)));
            myTelegramMock
                .expect(['hello...', 'there!'], done)
                .sendUpdate('hi bob', err => {
                    if (err) done(new Error('supertest error: ' + err));
                });
        });



    });

    describe('middleware specific params', () => {
        it('it should have the update that was sent', done => {
            myBotmaster.use(FulfillWare({
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
            myBotmaster.use(FulfillWare({
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
