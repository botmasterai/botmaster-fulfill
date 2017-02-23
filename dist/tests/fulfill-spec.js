'use strict';

var should = require('should');

var _require = require('../'),
    fulfill = _require.fulfill;

describe('fulfill', function () {

    describe('controller params', function () {

        describe('params.content', function () {
            it('it should return "hi bob" for an input "<hi>bob</hi> given an action "hi" that uses the content as a name to greet', function (done) {
                var actions = {
                    hi: {
                        controller: function controller(params) {
                            return 'hi ' + params.content;
                        }
                    }
                };
                fulfill(actions, {}, '<hi>bob</hi>', function (err, result) {
                    if (err) throw err;
                    result.should.equal('hi bob');
                    done();
                });
            });
        });

        describe('params.attributes', function () {
            it('it should return "hi bob" for an input "<hi name=bob /> given an action "hi" that uses the attribute name as a name to greet', function (done) {
                var actions = {
                    hi: {
                        controller: function controller(params) {
                            return 'hi ' + params.attributes.name;
                        }
                    }
                };
                fulfill(actions, {}, '<hi name="bob" />', function (err, result) {
                    if (err) throw err;
                    result.should.equal('hi bob');
                    done();
                });
            });

            it('it should always give attibutes even when there are none', function (done) {
                var actions = {
                    hi: {
                        controller: function controller(params) {
                            return should.exist(params.attributes) || done();
                        }
                    }
                };
                fulfill(actions, {}, '<hi/>', done);
            });
        });

        describe('params.index', function () {
            it('it should give the index of the element only taking into consideration other elements of the same tag', function (done) {
                var i = 0;
                var actions = {
                    series: true,
                    a: {
                        controller: function controller(_ref) {
                            var index = _ref.index;

                            index.should.equal(i);
                            i += 1;
                            return '';
                        }
                    }
                };
                fulfill(actions, {}, 'boop <a /> bop beep <b /> <a /> <c /> boop <a />', done);
            });
        });

        describe('params.all', function () {
            it('it should pass "hi  !  are you?" to "bob" controller when given input "hi <there /> <bob /> ! <how /> are you?"', function (done) {
                var actions = {
                    bob: {
                        controller: function controller(params) {
                            params.all.should.equal('hi   !  are you?');
                            done();
                        }
                    }
                };
                fulfill(actions, {}, 'hi <there /> <bob /> ! <how /> are you?', done);
            });
        });

        describe('params.after', function () {
            it('it should pass " ! <how/> are you?" to "bob" controller when given input "hi <there /> <bob /> ! <how /> are you?"', function (done) {
                var actions = {
                    bob: {
                        controller: function controller(params) {
                            params.after.should.equal(' ! <how></how> are you?');
                            done();
                        }
                    }
                };
                fulfill(actions, {}, 'hi <there /> <bob /> ! <how /> are you?', done);
            });
        });

        describe('params.before', function () {
            it('it should pass "hi" as params.before to action <bob /> in when given input "hi <bob />"', function (done) {
                var actions = {
                    bob: {
                        controller: function controller(params) {
                            params.before.should.equal('hi');
                            done();
                        }
                    }
                };
                fulfill(actions, {}, 'hi<bob />', done);
            });

            it('it should pass "hi <there/> " to bob controller when given input "hi <there /><bob /> ! <how /> are you?"', function (done) {
                var actions = {
                    bob: {
                        controller: function controller(params) {
                            params.before.should.equal('hi <there></there>');
                            done();
                        }
                    }
                };
                fulfill(actions, {}, 'hi <there /><bob /> ! <how / are you?', done);
            });
        });
    });

    describe('controller options', function () {
        describe('options.replace', function () {

            describe('replace = "all"', function () {
                it('it should return "swallowed" for an input "stuff to ignore <swallow /> more stuff to ignore" ', function (done) {
                    var actions = {
                        swallow: {
                            replace: 'all',
                            controller: function controller() {
                                return 'swallowed';
                            }
                        }
                    };
                    fulfill(actions, {}, 'stuff to ignore <swallow /> more stuff to ignore', function (err, result) {
                        if (err) throw err;
                        result.should.equal('swallowed');
                        done();
                    });
                });
            });
            describe('replace = "before"', function () {
                it('it should return "hi bob for an input "gibberish <hi /> bob <ignore />"', function (done) {
                    var actions = {
                        hi: {
                            replace: 'before',
                            controller: function controller() {
                                return 'hi';
                            }
                        },
                        ignore: {
                            controller: function controller() {
                                return '';
                            }
                        }
                    };
                    fulfill(actions, {}, 'gibberish <hi /> bob<ignore />', function (err, result) {
                        if (err) throw err;
                        result.should.equal('hi bob');
                        done();
                    });
                });

                it('it should return "hi bob for an input "foo <beep/> feep <boop /> gibberish <hi /> bob <ignore />"', function (done) {
                    var actions = {
                        hi: {
                            replace: 'before',
                            controller: function controller() {
                                return 'hi';
                            }
                        },
                        ignore: {
                            controller: function controller() {
                                return '';
                            }
                        }
                    };
                    fulfill(actions, {}, 'gibberish <hi /> bob<ignore />', function (err, result) {
                        if (err) throw err;
                        result.should.equal('hi bob');
                        done();
                    });
                });

                it('it should handle when an action replaces another action', function (done) {
                    var actions = {
                        hi: {
                            replace: 'before',
                            controller: function controller() {
                                return 'hi';
                            }
                        },
                        ignore: {
                            controller: function controller() {
                                return 'this should not appear';
                            }
                        }
                    };
                    fulfill(actions, {}, '<ignore /><hi />', function (err, result) {
                        if (err) throw err;
                        result.should.equal('hi');
                        done();
                    });
                });
            });
        });
        describe('options.series', function () {
            it('it should perform async operations in series when series = true (and parallel when series is not true)', function (done) {
                var counter = 0;
                var start = Date.now();
                var checkParallel = function checkParallel() {
                    var now = Date.now();
                    if (Math.abs(now - start - 50) < 30) return '-';else return '+';
                };
                var actions = {
                    count: {
                        series: true,
                        controller: function controller(params, cb) {
                            return setTimeout(function () {
                                return cb(null, '' + counter++);
                            }, 50);
                        }
                    },
                    parallel: {
                        parallel: true,
                        controller: function controller(params, cb) {
                            return setTimeout(function () {
                                return cb(null, checkParallel());
                            }, 50);
                        }
                    }
                };
                fulfill(actions, {}, '<count /><parallel /><count /><parallel /><count />', function (err, result) {
                    if (err) throw err;
                    result.should.equal('0-1-2');
                    done();
                });
            });
        });
    });

    describe('context updates', function () {
        it('context should have both foo and bar props on input result "<foo /> and <bar />', function (done) {
            var actions = {
                foo: {
                    controller: function controller(params) {
                        return params.context.foo = 1;
                    }
                },
                bar: {
                    controller: function controller(params) {
                        return params.context.bar = 1;
                    }
                }
            };
            var context = {};
            fulfill(actions, { context: context }, '<foo /> and <bar />', function (err) {
                if (err) throw err;
                context.should.eql({
                    foo: 1,
                    bar: 1
                });
                done();
            });
        });
    });

    describe('recursion', function () {
        it('should return a "finally" for input result <foo />, actions foo and bar which evaluate to "<bar />" and "finally"', function (done) {
            var actions = {
                foo: {
                    controller: function controller() {
                        return '<bar />';
                    }
                },
                bar: {
                    controller: function controller() {
                        return 'finally';
                    }
                }
            };
            fulfill(actions, {}, '<foo />', function (err, result) {
                if (err) throw err;
                result.should.equal('finally');
                done();
            });
        });
    });

    describe('iteration', function () {
        it('should return "John and Mary" for input result "<john /> and <mary />', function (done) {
            var actions = {
                john: {
                    controller: function controller() {
                        return 'John';
                    }
                },
                mary: {
                    controller: function controller() {
                        return 'Mary';
                    }
                }
            };
            fulfill(actions, {}, '<john /> and <mary />', function (err, result) {
                result.should.equal('John and Mary');
                done();
            });
        });
    });

    describe('multiple return types', function () {
        var actions = void 0;
        var result = 'hello world';
        beforeEach(function () {
            actions = {
                hi: {}
            };
        });

        it('it should return "hello world" with sync controller', function (done) {
            actions.hi.controller = function () {
                return result;
            };
            fulfill(actions, {}, '<hi />', function (err, result) {
                result.should.equal('hello world');
                done();
            });
        });

        it('it should return "hello world" with async controller returning function', function (done) {
            actions.hi.controller = function (params, cb) {
                return cb(null, result);
            };
            fulfill(actions, {}, '<hi />', function (err, result) {
                result.should.equal('hello world');
                done();
            });
        });

        it('it should return "hello world" with async controller returning nothing', function (done) {
            actions.hi.controller = function (params, cb) {
                setTimeout(function () {
                    return cb(null, result);
                }, 1);
            };
            fulfill(actions, {}, '<hi />', function (err, result) {
                result.should.equal('hello world');
                done();
            });
        });

        it('it should return "hello world" with promise controller', function (done) {
            actions.hi.controller = function () {
                return new Promise(function (resolve) {
                    return resolve(result);
                });
            };
            fulfill(actions, {}, '<hi />', function (err, result) {
                result.should.equal('hello world');
                done();
            });
        });

        it('it should catch an error with sync controller', function (done) {
            actions.hi.controller = function () {
                throw new Error('hi!');
            };
            fulfill(actions, {}, '<hi />', function (err) {
                err.message.should.equal('hi!');
                done();
            });
        });

        it('it should catch an error with async controller', function (done) {
            actions.hi.controller = function (params, cb) {
                return cb('hi!');
            };
            fulfill(actions, {}, '<hi />', function (err) {
                err.should.equal('hi!');
                done();
            });
        });

        it('it should catch an error with promise controller', function (done) {
            actions.hi.controller = function () {
                return new Promise(function (resolve, reject) {
                    return reject('hi!');
                });
            };
            fulfill(actions, {}, '<hi />', function (err) {
                err.should.equal('hi!');
                done();
            });
        });
    });

    describe('edge cases', function () {
        var actions = void 0;
        beforeEach(function () {
            actions = {
                hi: {}
            };
        });

        it('it should handle empty input', function (done) {
            actions.hi.controller = function (params, cb) {
                return cb('hi!');
            };
            fulfill(actions, {}, '', function (err, result) {
                result.should.equal('');
                done();
            });
        });

        it('it should handle empty action spec', function (done) {
            fulfill({}, {}, '<hi/>', function (err, result) {
                result.should.equal('<hi></hi>');
                done();
            });
        });

        it('it should handle an action spec that returns empty', function (done) {
            actions.hi.controller = function () {
                return '';
            };
            fulfill(actions, {}, 'hi <hi/>', function (err, result) {
                result.should.equal('hi ');
                done();
            });
        });
    });
});