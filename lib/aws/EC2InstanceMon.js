'use strict';
var Promise = require('bluebird');
var AWSMon = require('./AWSMon.js');

class EC2InstanceMon extends AWSMon {

    constructor(options) {
        super(options);

        this._ec2_client = Promise.promisifyAll(new this._AWS.EC2());
    }

    //
    // PUBLIC METHODS
    //

    product() {
        return 'EC2';
    }

    item_name() {
        return 'EC2 Instance';
    }

    get_items() {

        this._logger.debug('Polling EC2 Instances...');

        return this._ec2_client.describeInstancesAsync({}).then((value) => {

            let instances = {};

            for(let reservation of value.Reservations) {
                for(let instance of reservation.Instances) {
                    instances[instance.InstanceId] = instance;
                }
            }

            return instances;
        }).error((e) => {
            this._logger.error('Could not fetch information on EC2 Instances: ' + e);
            return {};
        });
    }
}

module.exports = EC2InstanceMon;




