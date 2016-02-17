'use strict';
var AWSFactory = require('./aws/Factory');
var AdapterRead = require('juttle/lib/runtime/adapter-read');
var Promise = require('bluebird');
var _ = require('underscore');
var FilterAWSCompiler = require('./filter-aws-compiler');
var JuttleMoment = require('juttle/lib/moment/juttle-moment');

class ReadAWS extends AdapterRead {
    periodicLiveRead() { return true;}

    defaultTimeRange() {
        return {
            from: this.params.now,
            to: new JuttleMoment(Infinity)
        };
    }

    constructor(options, params) {
        super(options, params);

        this.logger.debug('intitialize', options, params);

        this._filter_search_expr = AWSFactory.supported_products();

        if (params.filter_ast) {
            this.logger.debug('Filter ast: ', params.filter_ast);
            var compiler = new FilterAWSCompiler({
                supported_products: AWSFactory.supported_products()
            });
            this._filter_search_expr = compiler.compile(params.filter_ast);
            this.logger.debug('Filter expression: ', this._filter_search_expr);
        }

        this.logger.debug('Enabled Products:', this._filter_search_expr);

        this._plugins =  _.map(this._filter_search_expr, (product) => {
            return AWSFactory.create_aws_plugin(product, this.logger);
        });
    }

    // XXX/mstemm ignoring limit/state for now
    read(from, to, limit, state) {

        return Promise.map(this._plugins, (plugin) => {
            return plugin.poll(from);
        })
        .then((results) => {
            let points = [];

            // XXX/mstemm may need to sort all the points by time. But
            // for now, they all use the same now.

            for(var result of results) {
                if (result) {
                    points = points.concat(result);
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

