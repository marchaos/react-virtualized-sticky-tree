'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports['default'] = function () {
    if (typeof navigator !== 'undefined' && /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor)) {
        return '-webkit-sticky';
    }

    return 'sticky';
};