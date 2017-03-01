class Notifier {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.complete = resolve;
            this.error = reject;
        });
    }
    wrapCb(cb) {
        return (err, result) => {
            if (err) this.error(err);
            else this.complete(result);
            cb(err, result);
        };
    }
}

module.exports = {Notifier};
