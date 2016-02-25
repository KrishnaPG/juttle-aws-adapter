'use strict';
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var juttle_test_utils = require('juttle/test').utils;
var check_juttle = juttle_test_utils.check_juttle;
var expect = require('chai').expect;
var read_config = require('juttle/lib/config/read-config');

describe('aws adapter', function() {

    before(function() {

        // Try to read from the config file first. If not present,
        // look in the environment variable JUTTLE_AWS_CONFIG. In
        // TravisCI, the config is provided via the environment to
        // avoid putting sensitive information like ids/auth tokens in
        // source files.

        var config = read_config();
        var aws_config;

        if (_.has(config, 'adapters') &&
            _.has(config.adapters, 'aws')) {
            aws_config = config.adapters.aws;
        } else {

            if (! _.has(process.env, 'JUTTLE_AWS_CONFIG') ||
                process.env.JUTTLE_AWS_CONFIG === '') {
                throw new Error('To run this test, you must provide the adapter config via the environment as JUTTLE_AWS_CONFIG.');
            }
            aws_config = JSON.parse(process.env.JUTTLE_AWS_CONFIG);
        }

        aws_config.path = path.resolve(__dirname, '..');

        juttle_test_utils.configureAdapter({
            aws: aws_config
        });
    });

    describe('properly returns an error for invalid arguments like', function() {

        it(' a -from in the past', function() {
            return check_juttle({
                program: 'read aws -from :1 day ago: -to :now: | view table'
            }).then(() => {
                throw new Error('Program ran when it should have returned an error');
            })
            .catch(function(err) {
                expect(err.code).to.equal('ADAPTER-UNSUPPORTED-TIME-OPTION');
                expect(err.message).to.equal('Unsupported value for -from option: can not be before :now:');
            });
        });

    });

    describe('can read', function() {

        function validate_raw_point(point) {

            // Don't validate the full point, but do check for the
            // item name, time, and product.

            var item_names = {
                EC2: 'InstanceId',
                EBS: 'VolumeId',
                ELB: 'LoadBalancerName',
                RDS: 'DBInstanceIdentifier',
                CloudFront: 'Id',
                AutoScaling: 'AutoScalingGroupName',
                ElastiCache: 'CacheClusterId',
                Lambda: 'FunctionName'
            };

            expect(point).to.contain.keys(['time', 'product']);
            expect(_.keys(item_names)).to.include(point.product);
            expect(point).to.contain.keys([item_names[point.product]]);
        }

        function validate_agg_point(point) {

            var expected_fields = {
                AutoScaling: {
                    aggregates: ['AutoScaling Group Count', 'AutoScaling Group Total Size', 'AutoScaling Group Total Desired Capacity'],
                    demographics: ['AutoScaling Desired Capacity', 'AutoScaling Current Group Size', 'AutoScaling Health Check Type']
                },
                CloudFront: {
                    aggregates: ['CF Distribution Count'],
                    demographics: ['CF Status', 'CF Price Class', 'CF Enabled']
                },
                EBS: {
                    aggregates: ['EBS Volume Count', 'EBS Volume Total Size', 'EBS Volume Total Iops'],
                    demographics: ['EBS Volume Type', 'EBS Volume State', 'EBS Volume Status']
                },
                ElastiCache: {
                    aggregates: ['ElastiCache Cluster Count', 'ElastiCache Total Cache Nodes'],
                    demographics: ['ElastiCache Cache Node Type', 'ElastiCache Engine', 'ElastiCache Engine Version',
                                   'ElastiCache Cluster Status', 'ElastiCache Num Cache Nodes']
                },
                ELB: {
                    aggregates: ['ELB Load Balancer Count'],
                    demographics: ['ELB Scheme', 'ELB Health Check Target']
                },
                EC2: {
                    aggregates: ['EC2 Instance Count'],
                    demographics: ['EC2 Instance Type', 'EC2 Root Device Type', 'EC2 State']
                },
                Lambda: {
                    aggregates: ['Lambda Function Count', 'Lambda Total Memory Size'],
                    demographics: ['Lambda Runtime', 'Lambda Role', 'Lambda Timeout', 'Lambda Memory Size',
                                   'Lambda Version', 'Lambda Handler']
                },
                RDS: {
                    aggregates: ['RDS DB Count', 'RDS DB Total Allocated Storage', 'RDS DB Total Iops'],
                    demographics: ['RDS DB Class', 'RDS DB Engine', 'RDS DB Engine Version',
                                   'RDS DB License Model', 'RDS DB Retention Period', 'RDS DB PubliclyAccessible',
                                   'RDS DB Storage Type', 'RDS DB Status', 'RDS DB Read Replica Status']
                }

            };

            expect(point).to.contain.keys(['time', 'product', 'name', 'value', 'metric_type']);
            expect(['AWS Aggregate', 'AWS Demographic']).to.include(point.metric_type);
            expect(_.keys(expected_fields)).to.include(point.product);
            if (point.metric_type === 'AWS Aggregate') {
                expect(expected_fields[point.product].aggregates).to.include(point.aggregate);
                expect(point.name).to.equal('total');
            } else {
                expect(expected_fields[point.product].demographics).to.include(point.demographic);
            }
        }

        it('basic info', function() {
            return check_juttle({
                program: 'read aws -from :now: -to :1 second from now: | view text'
            })
            .then(function(result) {
                expect(result.errors).to.have.length(0);
                expect(result.warnings).to.have.length(0);
                for(let point of result.sinks.text) {
                    validate_raw_point(point);
                }
            });
        });

        it('aggregate info', function() {
            let aws_module_path = path.join(__dirname, '../aws_module.juttle');
            let awsmod = fs.readFileSync(aws_module_path).toString();
            return check_juttle({
                program: `import "aws_module.juttle" as AWSMod; read aws -from :now: -to :1 second from now: | AWSMod.aggregate_all | view text`,
                modules: {
                    'aws_module.juttle': awsmod
                }
            })
            .then(function(result) {
                expect(result.errors).to.have.length(0);
                expect(result.warnings).to.have.length(0);
                for(let point of result.sinks.text) {
                    validate_agg_point(point);
                }
            });
        });
    });
});


