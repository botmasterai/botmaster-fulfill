const fulfill = require('../');
const {botmaster, botmasterRunning, telegramMock, respond} = require('./helper');

describe('botmaster-fulfill', () => {

    before( () => botmasterRunning);

    it('should say hello world!', done => {
        botmaster.use('outgoing', fulfill({
            actions: {
                hi: {
                    controller: () => 'hello world!!'
                }
            }
        }));
        //botmaster.once( 'update', (bot, update) => nsole.log(update) && bot.sendMessage('<hi />'));
        respond(botmaster)('<hi />');
        botmaster.on('error', (bot, error) => console.error('botmaster error: ' + error));


        telegramMock
            .expect(['hello world!!'], done)
            .sendUpdate('hi bob', err => {if (err) console.error('supertest error: ' + err); else console.log('supertest done');});

    });
});
