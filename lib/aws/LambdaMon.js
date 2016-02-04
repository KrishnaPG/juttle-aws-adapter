'use strict';
var Promise = require('bluebird');
var _ = require('underscore');
var AWSMon = require('./AWSMon.js');

class LambdaMon extends AWSMon {
    constructor(options) {
        super(options);

        this._func_client = new this._AWS.Lambda();
        this._func_client.listFunctionsAsync = Promise.promisify(this._func_client.listFunctions);
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

            return this._func_client.listFunctionsAsync(opts).then((value) => {
                for(let func of value.Functions) {
                    funcs[func.FunctionName] = func;
                }

                if (_.has(value.Marker)) {
                    return list_funcs_batch(value.Marker);
                } else {
                    return Promise.resolve();
                }
            });
        };

        return list_funcs_batch(undefined).then(() => {
            return funcs;
        }).error((e) => {
            this._logger.info('Could not fetch information on Lambda Functions: ' + e);
            return {};
        });
    }
}

module.exports = LambdaMon;




