var _ = require('underscore');
var juttle_test_utils = require('juttle/test/runtime/specs/juttle-test-utils');
var Juttle = require('juttle/lib/runtime').Juttle;
var AWSAdapter = require('../');
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

        if (! _.has(config, "adapters")) {
            if (! _.has(process.env, "JUTTLE_AWS_CONFIG") ||
                process.env.JUTTLE_AWS_CONFIG === '') {
                throw new Error("To run this test, you must provide the adapter config via the environment as JUTTLE_AWS_CONFIG.");
            }
            var aws_config = JSON.parse(process.env.JUTTLE_AWS_CONFIG);
            config = {
                adapters: {
                    aws: aws_config
                }
            };
        }

        var adapter = AWSAdapter(config.adapters.aws, Juttle);

        Juttle.adapters.register(adapter.name, adapter);
    });

    describe(' properly returns an error for invalid arguments like', function() {

        it(' a -from in the past', function() {
            return check_juttle({
                program: 'read aws -from :1 day ago: -to :now: product="EC2" | view table'
            })
            .catch(function(err) {
                expect(err.code).to.equal('RT-ADAPTER-UNSUPPORTED-TIME-OPTION');
            });
        });

    });

    it(' can read basic info', function() {
        this.timeout(60000);
        return check_juttle({
            program: 'read aws -from :now: -to :now: product="EC2" | view table'
        })
        .then(function(result) {
            expect(result.errors).to.have.length(0);
            expect(result.warnings).to.have.length(0);
        });
    });
});


