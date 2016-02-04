'use strict';
var Promise = require('bluebird');
var AWSMon = require('./AWSMon.js');

class RDSMon extends AWSMon {

    constructor(options) {
        super(options);

        this._rds_client = Promise.promisifyAll(new this._AWS.RDS());
    }

    //
    // PUBLIC METHODS
    //
    product() {
        return 'RDS';
    }

    item_name() {
        return 'RDS DB';
    }

    get_items() {
        this._logger.debug('Polling RDS Instances...');

        return this._rds_client.describeDBInstancesAsync({}).then((value) => {

            let db_insts = {};

            for(let db_inst of value.DBInstances) {
                db_insts[db_inst.DBInstanceIdentifier] = db_inst;
            }

            return db_insts;
        }).error((e) => {
            this._logger.error('Could not fetch information on RDS DB Instances: ' + e);
            return {};
        });
    }
}

module.exports = RDSMon;




