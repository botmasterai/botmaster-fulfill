'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Notifier = function () {
    function Notifier() {
        var _this = this;

        _classCallCheck(this, Notifier);

        this.promise = new Promise(function (resolve) {
            _this.complete = resolve;
            _this.error = resolve;
        });
    }

    _createClass(Notifier, [{
        key: 'wrapCb',
        value: function wrapCb(cb) {
            var _this2 = this;

            return function (err, result) {
                if (err) {
                    if (!(err instanceof Error)) err = new Error(err);
                    _this2.error(err);
                } else _this2.complete(result);
                cb(err, result);
            };
        }
    }]);

    return Notifier;
}();

var SECRET_LT = 'LT_ENCODED_FOR_FULFILL';
var SECRET_GT = 'GT_ENCODED_FOR_FULFILL';

function escapeMalformed(text) {
    return text.replace(/<(?!\/?\w+( \w+=[^<>]+)?( ?\/)?>)/gm, SECRET_LT).replace(/(?<!<\/?\w+( \w+=[^<>]+)?( ?\/)?)>/gm, SECRET_GT);
}

function unescapeMalformed(text) {
    return text.replace(SECRET_LT, '<').replace(SECRET_GT, '>');
}

module.exports = {
    Notifier: Notifier,
    escapeMalformed: escapeMalformed,
    unescapeMalformed: unescapeMalformed
};