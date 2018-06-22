/**
 * Tests for escaping mostly
 */

const { escapeMalformed, unescapeMalformed } = require('../utils');

describe('escape malformed text', () => {
    [{
        original: '<?',
        escaped: 'LT_ENCODED_FOR_FULFILL?'
    }, {
        original: '?>',
        escaped: '?GT_ENCODED_FOR_FULFILL'
    }, {
        original: 'you need <3 bookings for that tow work',
        escaped: 'you need LT_ENCODED_FOR_FULFILL3 bookings for that tow work'
    }, {
        original: 'hi <pause></pause> how <are you>?',
        escaped: 'hi <pause></pause> how LT_ENCODED_FOR_FULFILLare youGT_ENCODED_FOR_FULFILL?'
    }, {
        original: 'hi <pause /> how <are you>?',
        escaped: 'hi <pause /> how LT_ENCODED_FOR_FULFILLare youGT_ENCODED_FOR_FULFILL?'
    }].forEach(text => {
        it('It can encode and decode "' + text.original + '"', () => {
            const escape = escapeMalformed(text.original);
            escape.should.equal(text.escaped);
            const unescape = unescapeMalformed(escape);
            unescape.should.equal(text.original);
        });
    });
});