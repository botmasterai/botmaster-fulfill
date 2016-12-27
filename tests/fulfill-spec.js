require('should');
const Promise = require('bluebird');
const {fulfill} = require('../fulfill');
const assert = require('assert');
const R = require('ramda');

describe('fulfill', () => {

    describe('Tag attributes and content are passed to the action controller")', () => {
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

        it('should return "hi bob" for an input "gibberish <hi /> bob <ignore />"', done => {
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

    describe('Actions that update context are reflected (assume "foo" and "bar" actions that update "foo" and "bar in context")', () => {
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

    describe('Evaluates recursively if the result from an action contains another action', () => {
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


    describe('Evaluates multiple tags in a result (assume "john" and "mary" actions which return "John" and "Mary")', () => {
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

    describe('Works with multiple return styles for the controllers (assume input result "<hi />" and action result "hello world"', () => {
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

        it('it should return "hello world" with async controller', done => {
            actions.hi.controller = (params, cb) => cb(null, result);
            fulfill(actions, {}, '<hi />', (err, result) => {
                result.should.equal('hello world');
                done();
            });

        });

        it('it should return "hello world" with promise controller', done => {
            actions.hi.controller = (params) => new Promise((resolve, reject) => resolve(result));
            fulfill(actions, {}, '<hi />', (err, result) => {
                result.should.equal('hello world');
                done();
            });

        });
    });
});
