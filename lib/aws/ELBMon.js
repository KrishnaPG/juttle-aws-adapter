'use strict';
var Promise = require('bluebird');
var AWSMon = require('./AWSMon.js');

class ELBMon extends AWSMon {

    constructor(options) {
        super(options);

        this._elb_client = Promise.promisifyAll(new this._AWS.ELB());
    }

    //
    // PUBLIC METHODS
    //

    product() {
        return 'ELB';
    }

    item_name() {
        return 'ELB Load Balancer';
    }

    get_items() {
        this._logger.debug('Polling ELB Load Balancers...');

        return this._elb_client.describeLoadBalancersAsync({}).then((value) => {
            let load_balancers = {};

            for(let elb of value.LoadBalancerDescriptions) {
                load_balancers[elb.LoadBalancerName] = elb;
            }

            return load_balancers;
        });
    }
}

module.exports = ELBMon;
