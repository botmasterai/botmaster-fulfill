class Notifier {
    constructor() {
        this.promise = new Promise((resolve) => {
            this.complete = resolve;
            this.error = resolve;
        });
    }
    wrapCb(cb) {
        return (err, result) => {
            if (err) {
                if (! (err instanceof Error))
                    err = new Error(err);
                this.error(err);
            }
            else this.complete(result);
            cb(err, result);
        };
    }
}

const SECRET_LT = 'LT_ENCODED_FOR_FULFILL'
const SECRET_GT = 'GT_ENCODED_FOR_FULFILL'

function escapeMalformed (text) {
    return text
        .replace(/<(?!\/?\w+( \w+=[^<>]+)?( ?\/)?>)/gm, SECRET_LT)
        .replace(/(?<!<\/?\w+( \w+=[^<>]+)?( ?\/)?)>/gm, SECRET_GT);
}

function unescapeMalformed (text) {
    return text
        .replace(SECRET_LT, '<')
        .replace(SECRET_GT, '>');
}

module.exports = {
    Notifier,
    escapeMalformed,
    unescapeMalformed
};
