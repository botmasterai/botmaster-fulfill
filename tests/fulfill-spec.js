require('should');
const {
    fulfill
} = require('../fulfill');

describe('fulfill', () => {

    describe('controller params', () => {

        describe('params.content', () => {
            it('it should return "hi bob" for an input "<hi>bob</hi> given an action "hi" that uses the content as a name to greet', done => {
                const actions = {
                    hi: {
                        controller: params => 'hi ' + params.content
                    }
                };
                fulfill(actions, {}, '<hi>bob</hi>', (err, result) => {
                    if (err) throw err;
                    result.should.equal('hi bob');
                    done();
                });
            });
        });

        describe('params.attributes', () => {
            it('it should return "hi bob" for an input "<hi name=bob /> given an action "hi" that uses the attribute name as a name to greet', done => {
                const actions = {
                    hi: {
                        controller: params => 'hi ' + params.attributes.name
                    }
                };
                fulfill(actions, {}, '<hi name="bob" />', (err, result) => {
                    if (err) throw err;
                    result.should.equal('hi bob');
                    done();
                });
            });
        });

    });

    describe('controller options', () => {
        describe('options.replace', () => {
            describe('replace = "adjacent"', () => {
                it('it should return "hi bob" for an input "gibberish <hi /> bob <ignore />"', done => {
                    const actions = {
                        hi: {
                            replace: 'adjacent',
                            controller: params => 'hi ' + params.after
                        },
                        ignore: {
                            controller: () => ''
                        }
                    };
                    fulfill(actions, {}, 'gibberish <hi /> bob <ignore />', (err, result) => {
                        if (err) throw err;
                        result.should.equal('hi bob');
                        done();
                    });
                });
            });
        });
        describe('options.series', () => {
            it('it should perform async operations in series when series = true (and parallel when series is not true)', done => {
                let counter = 0;
                const start = (new Date()).getTime();
                const checkParallel = () => {
                    const now = (new Date()).getTime();
                    if (Math.abs(now - start - 50) < 15)
                        return '-';
                    else
                        return '+';
                };
                const actions = {
                    count: {
                        series: true,
                        controller: (params, cb) => setTimeout(() => cb(null, '' + counter++), 50)
                    },
                    parallel: {
                        parallel: true,
                        controller: (params, cb) => setTimeout(() => cb(null, checkParallel()), 50)
                    }
                };
                fulfill(actions, {}, '<count /><parallel /><count /><parallel /><count />', (err, result) => {
                    if (err) throw err;
                    result.should.equal('0-1-2');
                    done();
                });

            });
        });
    });

    describe('context updates', () => {
        it('context should have both foo and bar props on input result "<foo /> and <bar />', done => {
            const actions = {
                foo: {
                    controller: params => params.context.foo = 1
                },
                bar: {
                    controller: params => params.context.bar = 1
                }
            };
            const context = {};
            fulfill(actions, context, '<foo /> and <bar />', err => {
                if (err) throw err;
                context.should.eql({
                    foo: 1,
                    bar: 1
                });
                done();
            });
        });
    });

    describe('recursion', () => {
        it('should return a "finally" for input result <foo />, actions foo and bar which evaluate to "<bar />" and "finally"', done => {
            const actions = {
                foo: {
                    controller: () => '<bar />'
                },
                bar: {
                    controller: () => 'finally'
                }
            };
            fulfill(actions, {}, '<foo />', (err, result) => {
                if (err) throw err;
                result.should.equal('finally');
                done();
            });
        });
    });


    describe('iteration', () => {
        it('should return "John and Mary" for input result "<john /> and <mary />', done => {
            const actions = {
                john: {
                    controller: () => 'John'
                },
                mary: {
                    controller: () => 'Mary'
                }
            };
            fulfill(actions, {}, '<john /> and <mary />', (err, result) => {
                result.should.equal('John and Mary');
                done();
            });
        });
    });

    describe('multiple return types', () => {
        let actions;
        const result = 'hello world';
        beforeEach(() => {
            actions = {
                hi: {}
            };
        });

        it('it should return "hello world" with sync controller', done => {
            actions.hi.controller = () => result;
            fulfill(actions, {}, '<hi />', (err, result) => {
                result.should.equal('hello world');
                done();
            });

        });

        it('it should return "hello world" with async controller returning function', done => {
            actions.hi.controller = (params, cb) => cb(null, result);
            fulfill(actions, {}, '<hi />', (err, result) => {
                result.should.equal('hello world');
                done();
            });

        });

        it('it should return "hello world" with async controller returning nothing', done => {
            actions.hi.controller = (params, cb) => {setTimeout(() => cb(null, result), 1);};
            fulfill(actions, {}, '<hi />', (err, result) => {
                result.should.equal('hello world');
                done();
            });

        });

        it('it should return "hello world" with promise controller', done => {
            actions.hi.controller = () => new Promise((resolve) => resolve(result));
            fulfill(actions, {}, '<hi />', (err, result) => {
                result.should.equal('hello world');
                done();
            });
        });

        it('it should catch an error with sync controller', done => {
            actions.hi.controller = () => {
                throw new Error('hi!');
            };
            fulfill(actions, {}, '<hi />', err => {
                err.message.should.equal('hi!');
                done();
            });

        });

        it('it should catch an error with async controller', done => {
            actions.hi.controller = (params, cb) => cb('hi!');
            fulfill(actions, {}, '<hi />', err => {
                err.should.equal('hi!');
                done();
            });

        });

        it('it should catch an error with promise controller', done => {
            actions.hi.controller = () => new Promise((resolve, reject) => reject('hi!'));
            fulfill(actions, {}, '<hi />', err => {
                err.should.equal('hi!');
                done();
            });
        });
    });

    describe('edge cases', () => {
        let actions;
        beforeEach(() => {
            actions = {
                hi: {}
            };
        });

        it('it should handle empty input', done => {
            actions.hi.controller = (params, cb) => cb('hi!');
            fulfill(actions, {}, '', (err, result) => {
                result.should.equal('');
                done();
            });
        });

        it('it should handle empty action spec', done => {
            fulfill({}, {}, '<hi/>', (err, result) => {
                result.should.equal('<hi/>');
                done();
            });
        });
    });
});
