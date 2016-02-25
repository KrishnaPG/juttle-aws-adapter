'use strict';

var JuttleParser = require('juttle/lib/parser');
var SemanticPass = require('juttle/lib/compiler/semantic');
var FilterSimplifier = require('juttle/lib/compiler/filters/filter-simplifier');
var expect = require('chai').expect;
let withAdapterAPI = require('juttle/test').utils.withAdapterAPI;

withAdapterAPI(() => {

    /* global JuttleAdapterAPI */
    let JuttleMoment = JuttleAdapterAPI.types.JuttleMoment;
    let JuttleErrors = JuttleAdapterAPI.errors;
    let FilterAWSCompiler = require('../lib/filter-aws-compiler');
    let simplifier = new FilterSimplifier();

    function verify_compile_error(source, feature) {
        var ast = JuttleParser.parseFilter(source).ast;

        var semantic = new SemanticPass({ now: new JuttleMoment() });
        semantic.sa_expr(ast);

        ast = simplifier.simplify(ast);

        var compiler = compiler || new FilterAWSCompiler({
            supported_products: ['EC2', 'EBS']
        });

        try {
            compiler.compile(ast);
            throw new Error('Compile succeeded when it should have failed');
        } catch (e) {
            expect(e).to.be.instanceOf(JuttleErrors.CompileError);
            expect(e.code).to.equal('FILTER-FEATURE-NOT-SUPPORTED');
            expect(e.info.feature).to.equal(feature);
        }
    }

    function verify_compile_success(source, expected) {
        var ast = JuttleParser.parseFilter(source).ast;

        var semantic = new SemanticPass({ now: new JuttleMoment() });
        semantic.sa_expr(ast);

        ast = simplifier.simplify(ast);

        var compiler = new FilterAWSCompiler({
            supported_products: ['EC2', 'EBS']
        });

        var search_expr = compiler.compile(ast);
        expect(search_expr).to.deep.equal(expected);
    }

    describe('aws filter', function() {

        describe('properly returns errors for invalid filtering expressions like', function() {

            var invalid_unary_operators = ['!', '-'];

            for(let op of invalid_unary_operators) {
                it('using unary operator ' + op + ' in field specifications', function() {
                    verify_compile_error('product = ' + op + ' "foo"',
                                         `the "${op}" operator`);
                });
            }

            var invalid_operators = ['=~', '!~', '<', '<=', '>', '>=', 'in'];
            for(let op of invalid_operators) {
                it('using ' + op + ' in field comparisons', function() {
                    verify_compile_error('product ' + op + ' "foo"',
                                         'operator ' + op);
                });
            }

            it('Combining terms with AND', function() {
                verify_compile_error('product="EC2" AND product="EBS"',
                                     'operator AND');
            });

            it('Using NOT on a term', function() {
                verify_compile_error('NOT product="EC2"',
                                     'the "NOT" operator');
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
                                     'fulltext search');
            });
        });

        describe('properly returns condition lists for valid cases like', function() {
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
});
