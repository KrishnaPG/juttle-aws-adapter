'use strict';

/* global JuttleAdapterAPI */
var AdapterRead = JuttleAdapterAPI.AdapterRead;
var JuttleMoment = JuttleAdapterAPI.types.JuttleMoment;
var FilterAWSCompiler = require('./filter-aws-compiler');

var AWSFactory = require('./aws/Factory');
var Promise = require('bluebird');
var _ = require('underscore');

class ReadAWS extends AdapterRead {
    periodicLiveRead() { return true;}

    defaultTimeOptions() {
        return {
            from: new JuttleMoment({moment: this.params.now.moment.clone(), epsilon: true}),
            to: this.params.now
        };
    }

    constructor(options, params) {
        super(options, params);

        this.logger.debug('intitialize', options, params);

        if (_.has(options, 'from') && options.from.lt(params.now)) {
            throw this.compileError('ADAPTER-UNSUPPORTED-TIME-OPTION', {
                option: '-from',
                message: 'can not be before :now:'
            });
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

