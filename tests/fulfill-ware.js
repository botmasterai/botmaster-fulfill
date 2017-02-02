const {FulfillWare} = require('../FulfillWare');
require('should');

describe('fulfill outgoing ware', () => {

    it('should say hello world!', done => {
        const actions = {
            hi: {
                controller: () => 'hi world'
            }
        };
        const ware = FulfillWare({actions});
        const update = {message: {text: '<hi />'}};
        const bot = {type: 'not a real bot'};
        ware(
            bot,
            update,
            (err) => {
                if (err) return done(err);
                update.message.text.should.equal('hi world');
                done();
            }
            );
    });

    it('should have bot in params', done => {
        const actions = {
            hi: {
                controller: params => {
                    if (!params.bot)
                        throw new Error('no bot!');
                    if (params.context)
                        throw new Error('why do you still have context');
                    params.bot.type.should.equal('not a real bot');
                    return 'bo';
                }
            }
        };
        const ware = FulfillWare({actions});
        const update = {message: {text: '<hi />'}};
        const bot = {type: 'not a real bot'};
        ware(
            bot,
            update,
            (err) => {
                if (err) return done(err);
                done();
            }
            );
    });

});
