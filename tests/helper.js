const nock = require('nock');
const request = require('supertest');
const Botmaster = require('botmaster');

const telegramToken = 'abc';
const telegramWebhookEndpoint = '/boo124/';

const telegram = {
    credentials: {
        authToken: telegramToken
    },
    webhookEndpoint: telegramWebhookEndpoint
};
const botsSettings = [{telegram}];

const botmaster = new Botmaster({botsSettings});

const botmasterRunning = new Promise( (resolve, reject) => {
    botmaster.on('server running', resolve);
    botmaster.on('error', reject);
});

const telegramBots = botmaster.getBots('telegram');
const telegramBot = telegramBots[0];

const telegramNock = nock(`https://api.telegram.org/bot${telegramToken}`).log(console.log);


const respond = botmaster => text =>
    botmaster.once( 'update', bot => bot.sendMessage(incomingUpdate(text)));

const incomingMessage = text => ({
    update_id: 123,
    message: {
        message_id: 123,
        from: {
            id: 123,
            first_name: 'testerbot'
        },
        date: 631152000, // 1/1/1990
        text: text || 'hi'
    }
});

const incomingUpdate = text => ({
    raw: 'some raw object data',
    sender: {
        id: 123
    },
    recipient: {
        id: 123
    },
    timestamp: 1468325836000,
    message: {
        mid: '4666071',
        seq: 1,
        text: text || 'the users text'
    }
});

const outgoingMessage = text => ({
    recipient: {
        id: 'invalidId'
    },
    message: {
        text: text || 'the bots text'
    }
});

const telegramMock = {
    sendUpdate: (update, cb) => {
        request(botmaster.app)
            .post('/telegram' + telegramWebhookEndpoint)
            .send(incomingMessage(update))
            .expect(200)
            .end(cb);
        return telegramMock;
    },
    expect: (responses, cb) => {
        // mock the response on updating telegram
        // return this to prevent errors in botmaster
        const telegramResponse = {
            result: {}
        };

        responses.forEach((response, i) => {
            telegramNock
                .post('/sendMessage', body => body.text == response || cb(new Error(`${body.text} does not match ${response}`)))
                .reply(200, () => {
                    console.log('yaya 200')
                    if (i + 1 == responses.length) cb();
                    return telegramResponse;
                });

        });
        return telegramMock;
    }
};


module.exports = {
    incomingUpdate,
    outgoingMessage,
    incomingMessage,
    telegramBot,
    botmaster,
    botmasterRunning,
    telegramMock,
    respond
};
