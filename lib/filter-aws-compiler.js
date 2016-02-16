// Compiler that transforms a filter expression AST into an array of
// conditions that control what metrics to fetch.
//
// The expression is returned from the compile method.

var ASTVisitor = require('juttle/lib/compiler/ast-visitor');
var JuttleErrors = require('juttle/lib/errors');
var _ = require('underscore');

// FilterAWSCompiler derives from ASTVisitor which provides a way to
// traverse the abstract syntax tree that the juttle compiler
// generates for the read command's filter expression.
//
// While traversing the tree, callbacks are called for the various
// parts of the filter expression. The FilterAWSCompiler object maps
// individual items in the tree into an array of conditions that
// control what metrics to fetch.
//
// Here's the supported filtering expression:
//  The expression can be a variable length list of simple key=value
//      pairs, separated by OR.
//    - No other boolean logic (ANDs, NOT, etc) is allowed.
//    - No comparisons other than '=' between keys and
//      values are allowed.
//  The only possible value for key can be:
//    - 'product': specifying a specific product such as 'EC2', 'ELB',
//                 etc.  If multiple products are specified, the
//                 adapter fetches information for both sets of
//                 products.

var FilterAWSCompiler = ASTVisitor.extend({
    initialize: function(options) {
        this.cloudwatch = options.cloudwatch;
        this.supported_products = options.supported_products;
    },

    throwUnsupportedFilter(location, filter) {
        throw JuttleErrors.compileError('RT-ADAPTER-UNSUPPORTED-FILTER', {
            proc: 'read cloudwatch',
            filter: filter,
            location: location
        });
    },

    compile: function(node) {
        return this.visit(node);
    },

    visitStringLiteral: function(node) {
        return node.value;
    },

    visitUnaryExpression: function(node) {
        switch (node.operator) {
            // '*' is the field dereferencing operator. For example,
            // given a search string product = 'CloudWatch', the UnaryExpression
            // * on product means 'the field called product'.
            case '*':
                return this.visit(node.expression);

            default:
                this.throwUnsupportedFilter(node.location, 'operator ' + node.operator);
        }
    },

    visitBinaryExpression: function(node) {
        var left, right;

        switch (node.operator) {

            case 'OR':
                left = this.visit(node.left);
                right = this.visit(node.right);

                return _.union(left, right);

            case '==':
                left = this.visit(node.left);
                right = this.visit(node.right);

                // Left *must* be 'product', and right must be one of
                // the supported AWS products.
                if (left !== 'product') {
                    this.throwUnsupportedFilter(node.location, 'condition ' + left);
                }

                if (! _.contains(this.supported_products, right)) {
                    this.throwUnsupportedFilter(node.location, 'product ' + right);
                }

                return [right];

            default:
                this.throwUnsupportedFilter(node.location, 'operator ' + node.operator);
        }
    },

    visitExpressionFilterTerm: function(node) {
        return this.visit(node.expression);
    }
});

module.exports = FilterAWSCompiler;
