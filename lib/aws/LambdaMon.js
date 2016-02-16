'use strict';
var Promise = require('bluebird');
var _ = require('underscore');
var AWSMon = require('./AWSMon.js');

class LambdaMon extends AWSMon {
    constructor(options) {
        super(options);

        // Lambda has its own invokeAsync method, so use the extension
        // Bsync.
        this._func_client = Promise.promisifyAll(new this._AWS.Lambda(), {suffix: 'Bsync'});
    }

    //
    // PUBLIC METHODS
    //

    product() {
        return 'Lambda';
    }

    item_name() {
        return 'Lambda Function';
    }

    get_items() {
        this._logger.debug('Polling Lambda Functions...');

        let funcs = {};

        let list_funcs_batch = (marker) => {
            let opts = {};
            if (marker) {
                opts = _.extend(opts, {Marker: marker});
            }

            return this._func_client.listFunctionsBsync(opts).then((value) => {
                for(let func of value.Functions) {
                    funcs[func.FunctionName] = func;
                }

                if (_.has(value, 'Marker')) {
                    return list_funcs_batch(value.Marker);
                }
            });
        };

        return list_funcs_batch(undefined).then(() => {
            return funcs;
        });
    }
}

module.exports = LambdaMon;
