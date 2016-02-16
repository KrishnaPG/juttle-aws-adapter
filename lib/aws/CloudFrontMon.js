'use strict';
var Promise = require('bluebird');
var _ = require('underscore');
var AWSMon = require('./AWSMon.js');

class CloudFrontMon extends AWSMon {
    constructor(options) {
        super(options);

        this._cf_client = Promise.promisifyAll(new this._AWS.CloudFront());
    }

    //
    // PUBLIC METHODS
    //

    product() {
        return 'CloudFront';
    }

    item_name() {
        return 'CF Distribution';
    }

    get_items() {
        this._logger.debug('Polling CloudFront Distributions...');

        let ids = [];

        let list_dists_batch = (next_marker) => {
            let opts = {};
            if (next_marker) {
                opts = _.extend(opts, {Marker: next_marker});
            }

            return this._cf_client.listDistributionsAsync(opts).then((value) => {
                for(let item of value.Items) {
                    ids.push(item.Id);
                }

                if (value.IsTruncated) {
                    return list_dists_batch(value.NextMarker);
                }
            });
        };

        return list_dists_batch(undefined).then(() => {
            return Promise.map(ids, (id) => {
                return this._cf_client.getDistributionAsync({Id: id});
            }, {concurrency: 10});
        }).then((dists) => {
            let items = {};
            for(let dist of dists) {
                // All of the useful information is in
                // Distribution, so just return that.
                items[dist.Id] = dist.Distribution;
            }

            return items;
        });
    }
}

module.exports = CloudFrontMon;
