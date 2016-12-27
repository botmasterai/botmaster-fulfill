const {outgoing} = require('../');
const {
    botmaster,
    telegramMock,
    respond,
    outgoingMessage
} = require('./helper');

describe('botmaster-fulfill', () => {
    let myBotmaster;
    let myTelegramMock;

    beforeEach(() => botmaster().then(botmaster => {
        myTelegramMock = telegramMock(botmaster);
        myBotmaster = botmaster;
    }));

    it('it should say hello world!', done => {
        myBotmaster.use('outgoing', outgoing({
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
            myBotmaster.use('outgoing', outgoing({
                actions: {
                    send: {
                        controller: params => params.context.bot
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

    afterEach(function(done) {
        this.retries(4);
        process.nextTick(() => {
            myTelegramMock.cleanAll();
            myBotmaster.server.close(done);
        });
    });
});
