'use strict';
var Promise = require('bluebird');
var _ = require('underscore');
var AWSMon = require('./AWSMon.js');

class ElastiCacheMon extends AWSMon {
    constructor(options) {
        super(options);

        this._ec_client = Promise.promisifyAll(new this._AWS.ElastiCache());
    }

    //
    // PUBLIC METHODS
    //

    product() {
        return 'ElastiCache';
    }

    item_name() {
        return 'ElastiCache Cluster';
    }

    get_items() {
        this._logger.debug('Polling ElastiCache Clusters...');

        let clusters = {};

        let list_clusters_batch = (marker) => {
            var opts = {};
            if (marker) {
                opts = _.extend(opts, {Marker: marker});
            }

            return this._ec_client.describeCacheClustersAsync(opts).then((value) => {
                for(let cluster of value.CacheClusters) {
                    clusters[cluster.CacheClusterId] = cluster;
                }

                if (_.has(value, 'Marker')) {
                    return list_clusters_batch(value.Marker);
                }
            });
        };

        return list_clusters_batch(undefined).then(() => {
            return clusters;
        });
    }
}

module.exports = ElastiCacheMon;
