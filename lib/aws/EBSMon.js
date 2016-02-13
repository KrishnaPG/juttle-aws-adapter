'use strict';
var Promise = require('bluebird');
var AWSMon = require('./AWSMon.js');

class EBSMon extends AWSMon {

    constructor(options) {
        super(options);

        this._ec2_client = Promise.promisifyAll(new this._AWS.EC2());
    }

    //
    // PUBLIC METHODS
    //

    product() {
        return 'EBS';
    }

    item_name() {
        return 'EBS Volume';
    }

    get_items() {
        this._logger.debug('Polling EBS Volumes...');

        // We do two calls. The first describes the volumes to get the
        // list of volumes. The second gets the volume status for each
        // volume.
        let volumes = {};

        return this._ec2_client.describeVolumesAsync({}).then((value) => {
            for(let volume of value.Volumes) {
                volumes[volume.VolumeId] = volume;
            }

            return this._ec2_client.describeVolumeStatusAsync({});
        }).then((value) => {
            for(let status of value.VolumeStatuses) {
                volumes[status.VolumeId].VolumeStatus = status.VolumeStatus;
            }

            return volumes;
        });
    }
}

module.exports = EBSMon;
