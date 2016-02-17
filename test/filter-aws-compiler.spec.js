'use strict';
var JuttleParser = require('juttle/lib/parser');
var SemanticPass = require('juttle/lib/compiler/semantic');
var JuttleErrors = require('juttle/lib/errors');
var JuttleMoment = require('juttle/lib/moment').JuttleMoment;
var FilterAWSCompiler = require('../lib/filter-aws-compiler');
var expect = require('chai').expect;

function verify_compile_error(source, filter) {
    var ast = JuttleParser.parseFilter(source).ast;

    var semantic = new SemanticPass({ now: new JuttleMoment() });
    semantic.sa_expr(ast);

    var compiler = compiler || new FilterAWSCompiler({
        supported_products: ['EC2', 'EBS']
    });

    try {
        compiler.compile(ast);
    } catch (e) {
        expect(e).to.be.instanceOf(JuttleErrors.CompileError);
        expect(e.code).to.equal('RT-ADAPTER-UNSUPPORTED-FILTER');
        expect(e.info.filter).to.equal(filter);
    }
}

function verify_compile_success(source, expected) {
    var ast = JuttleParser.parseFilter(source).ast;

    var semantic = new SemanticPass({ now: new JuttleMoment() });
    semantic.sa_expr(ast);

    var compiler = new FilterAWSCompiler({
        supported_products: ['EC2', 'EBS']
    });

    var search_expr = compiler.compile(ast);
    expect(search_expr).to.deep.equal(expected);
}

describe('aws filter', function() {

    describe(' properly returns errors for invalid filtering expressions like ', function() {

        var invalid_unary_operators = ['!', '-'];

        invalid_unary_operators.forEach(function(op) {
            it('using unary operator ' + op + ' in field specifications', function() {
                verify_compile_error('product = ' + op + ' "foo"',
                                     'operator ' + op);
            });
        });

        var invalid_operators = ['=~', '!~', '<', '<=', '>', '>=', 'in'];
        invalid_operators.forEach(function(op) {
            it('using ' + op + ' in field comparisons', function() {
                verify_compile_error('product ' + op + ' "foo"',
                                     'operator ' + op);
            });
        });

        it('Combining terms with AND', function() {
            verify_compile_error('product="EC2" AND product="EBS"',
                                 'operator AND');
        });

        it('Using NOT on a term', function() {
            verify_compile_error('NOT product="EC2"',
                                 'operator NOT');
        });

        it('A filter term not containing "product"', function() {
            verify_compile_error('foo="EC2"',
                                 'condition foo');
        });

        it('matching on unsupported products', function() {
            verify_compile_error('product = "RDS"',
                                 'product RDS');
        });

        it('a single filter expression', function() {
            verify_compile_error('\"foo\"',
                                 'filter term UnaryExpression');
        });

        it('not a filter expression or string', function() {
            verify_compile_error('+ 1',
                                 'operator +');
        });
    });

    describe(' properly returns condition lists for valid cases like ', function() {
        it('Single product match', function() {
            verify_compile_success('product="EC2"', ['EC2']);
        });

        it('Multiple product matches', function() {
            verify_compile_success('product="EC2" OR product="EBS"', ['EC2', 'EBS']);
        });

        it('Multiple product matches w/ duplicates', function() {
            verify_compile_success('product="EC2" OR product="EC2"', ['EC2']);
        });
    });
});
