'use strict';
var AWS = require('aws-sdk');
var EC2InstanceMon = require('./EC2InstanceMon.js');
var EBSMon = require('./EBSMon.js');
var ELBMon = require('./ELBMon.js');
var RDSMon = require('./RDSMon.js');
var CloudFrontMon = require('./CloudFrontMon.js');
var AutoScalingMon = require('./AutoScalingMon.js');
var ElastiCacheMon = require('./ElastiCacheMon.js');
var LambdaMon = require('./LambdaMon.js');
var _ = require('underscore');

// Maps from product name to class.
const PRODUCTS = {
    EC2: EC2InstanceMon,
    EBS: EBSMon,
    ELB: ELBMon,
    RDS: RDSMon,
    CloudFront: CloudFrontMon,
    AutoScaling: AutoScalingMon,
    ElastiCache: ElastiCacheMon,
    Lambda: LambdaMon
};

class AWSFactory {
    static supported_products() {
        return _.keys(PRODUCTS);
    }

    static create_aws_plugin(product, logger, cw_opts) {
        var opts = {
            AWS: AWS,
            logger: logger
        };

        return new PRODUCTS[product](opts);
    }

    static init(config) {
        AWS.config.update({
            accessKeyId: config.access_key,
            secretAccessKey: config.secret_key,
            region: config.region
        });
    }
}

module.exports = AWSFactory;
