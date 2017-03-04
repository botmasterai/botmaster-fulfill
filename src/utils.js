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

module.exports = {Notifier};
