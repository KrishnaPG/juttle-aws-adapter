'use strict';
var Promise = require('bluebird');
var _ = require('underscore');
var AWSMon = require('./AWSMon.js');

class AutoScalingMon extends AWSMon {

    constructor(options) {
        super(options);

        this._as_client = Promise.promisifyAll(new this._AWS.AutoScaling());
    }

    //
    // PUBLIC METHODS
    //

    product() {
        return 'AutoScaling';
    }

    item_name() {
        return 'AutoScaling Group';
    }

    get_items(now) {
        this._logger.debug('Polling AutoScaling Groups...');

        let groups = {};

        let list_groups_batch = (next_token) => {
            let opts = {};
            if (next_token) {
                opts = _.extend(opts, {NextToken: next_token});
            }

            return this._as_client.describeAutoScalingGroupsAsync(opts).then((value) => {
                for(let group of value.AutoScalingGroups) {

                    // One annoying thing about the returned results
                    // is that the list of instances for each group is
                    // not returned in a consistent order. So sort the
                    // instances by instance id, replacing the current
                    // list.
                    group.Instances = _.sortBy(group.Instances, 'InstanceId');

                    groups[group.AutoScalingGroupName] = group;
                }

                if (_.has(value, 'NextToken')) {
                    return list_groups_batch(value.NextToken);
                }
            });
        };

        return list_groups_batch(undefined).then(() => {
            return groups;
        });
    }
}

module.exports = AutoScalingMon;
