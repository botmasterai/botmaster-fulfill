const nock = require('nock');
const request = require('supertest');
const Botmaster = require('botmaster');
const debug = require('debug')('botmaster:fulfill:test');

const telegramToken = 'abc';
const telegramWebhookEndpoint = '/boo124/';

const telegram = {
    credentials: {
        authToken: telegramToken
    },
    webhookEndpoint: telegramWebhookEndpoint
};
const botsSettings = [{telegram}];

const botmaster = () => new Promise( (resolve, reject) => {
    const botmaster = new Botmaster({botsSettings});
    botmaster.on('server running', () => resolve(botmaster));
    botmaster.on('error', reject);
});

const telegramBots = botmaster => botmaster.getBots('telegram');
const telegramBot = botmaster => telegramBots(botmaster)[0];

const telegramNock = () => nock(`https://api.telegram.org/bot${telegramToken}`).log(debug);


/**
 * have bot master response done with a text. Chain it by calling it response(botmaster)(text)
 * @param  {object} botmaster botmaster to work with
 * @param  {String} text bot text to send
 */
const respond = botmaster => text =>
    botmaster.once( 'update', bot => bot.sendMessage(incomingUpdate(text)));

/**
 * generate a new telegram incoming message for use with botmaster
 * @param  {string} text optional - the users text
 * @return {Object}      a mock telegram incoming message to use with telegramMock.sendMessage
 */
const incomingMessage = (text = 'hi') => ({
    update_id: 123,
    message: {
        message_id: 123,
        from: {
            id: 123,
            first_name: 'testerbot'
        },
        date: 631152000, // 1/1/1990
        text: text
    }
});

/**
 * [incomingUpdate description]
 * @param  {String} text       optional- the bots text
 * @return {Object}            mock botmaster update after update handler
 */
const incomingUpdate = (text = 'the users test' )=> ({
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
        text
    }
});

/**
 * [outgoingMessage description]
 * @param  {String} text       optional- the bots text
 * @return {Object}            message to send with bot.sendMessage
 */
const outgoingMessage = (text = 'the bots text') => ({
    recipient: {
        id: 'invalidId'
    },
    message: {
        text
    }
});

/**
 * A chainable mock for telegram that can send and expect messages. Construct it by calling it with these params.
 * @param  {Object} botmaster             the botmaster object being tested. we use this to get the app for use with supertest.
 * @param  {Object} mock                  optional - a nock scope
 * @return {Object}                       mock object with methods
 */
const telegramMock = (botmaster, mock = telegramNock() ) => ({
    /**
     * mock telegram sending botmaster an update
     * @param  {object}   update telegram update
     * @param  {Function} cb     error-first callback with response object from botmaster
     * @return {Object}          the telegraMock object for chaining
     */
    sendUpdate: (update, cb) => {
        request(botmaster.app)
            .post('/telegram' + telegramWebhookEndpoint)
            .send(incomingMessage(update))
            .expect(200)
            .end(cb);
        return telegramMock(botmaster, mock);
    },
    /**
     * expect botmaster to send certain responses
     * @param  {Array}   responses a series of botmaster responses to expect in order
     * @param  {Function} cb     error-first callback
     * @return {Object}          the telegraMock object for chaining
     */
    expect: (responses, cb) => {
        // return this to prevent errors in botmaster
        const telegramResponse = {
            result: {}
        };

        responses.forEach((response, i) => {
            mock
                .post('/sendMessage', body => body.text == response || cb(new Error(`${body.text} does not match ${response}`)))
                .reply(200, () => {
                    if (i + 1 == responses.length) cb();
                    return telegramResponse;
                });

        });
        return telegramMock(botmaster, mock);
    },
    /**
     * sugar syntax for nock.cleanAll() to remove any existing mocks
     */
    cleanAll: () => nock.cleanAll()
});


module.exports = {
    incomingUpdate,
    outgoingMessage,
    incomingMessage,
    telegramBot,
    botmaster,
    telegramMock,
    respond
};
