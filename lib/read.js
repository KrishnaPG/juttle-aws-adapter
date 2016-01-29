'use strict';
var AWSFactory = require('./aws/Factory');
var AdapterRead = require('juttle/lib/runtime/adapter-read');
var errors = require('juttle/lib/errors');
var Promise = require('bluebird');
var _ = require('underscore');
var FilterAWSCompiler = require('./filter-aws-compiler');

class ReadAWS extends AdapterRead {
    static get timeRequired() { return true; }

    constructor(options, params) {
        super(options, params);

        this.logger.debug('intitialize', options, params);

        var allowed_options = AdapterRead.commonOptions.concat([]);
        var unknown = _.difference(_.keys(options), allowed_options);

        if (unknown.length > 0) {
            throw new errors.compileError('RT-UNKNOWN-OPTION-ERROR',
                                          {proc: 'read aws', option: unknown[0]});
        }

        this._filter_search_expr = AWSFactory.supported_products();

        if (params.filter_ast) {
            this.logger.debug('Filter ast: ', params.filter_ast);
            var compiler = new FilterAWSCompiler({
                supported_products: AWSFactory.supported_products()
            });
            this._filter_search_expr = compiler.compile(params.filter_ast);
            this.logger.debug('Filter expression: ', this._filter_search_expr);
        }

        this.logger.info('Enabled Products:', this._filter_search_expr);

        this._plugins =  _.map(this._filter_search_expr, (aws_product) => {
            return AWSFactory.create_aws_plugin(aws_product, this.logger);
        });
    }

    start() {
    }

    // XXX/mstemm ignoring limit/state for now
    read(from, to, limit, state) {

        this.logger.debug('from=' + from + ' to=' + to);

        var promises = _.map(this._plugins, (plugin) => {
            return plugin.poll(from, to);
        });

        return Promise.all(promises).then((results) => {
            let points = [];

            // XXX/mstemm may need to sort all the points by time. But
            // for now, they all use the same now.

            for(var result of results) {
                if (result) {
                    if (result.metrics && result.metrics.length > 0) {
                        points = points.concat(result.metrics);
                    }
                    if (result.events && result.events.length > 0) {
                        points = points.concat(result.events);
                    }
                }
            }

            let ret =  {
                points: points,
                readEnd: to
            };
            return ret;
        });
    }
}

function init(config) {
    AWSFactory.init(config);
}

module.exports = {
    init: init,
    read: ReadAWS
};

