'use strict';
// Compiler that transforms a filter expression AST into an array of
// conditions that control what metrics to fetch.
//
// The expression is returned from the compile method.

/* global JuttleAdapterAPI */
let StaticFilterCompiler = JuttleAdapterAPI.compiler.StaticFilterCompiler;
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

class FilterAWSCompiler extends StaticFilterCompiler {

    constructor(options) {
        super(options);
        this.cloudwatch = options.cloudwatch;
        this.supported_products = options.supported_products;
    }

    compile(node) {
        return this.visit(node);
    }

    visitStringLiteral(node) {
        return node.value;
    }

    visitField(node) {
        return node.name;
    }

    visitBinaryExpression(node) {
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
                    this.featureNotSupported(node, 'condition ' + left);
                }

                if (! _.contains(this.supported_products, right)) {
                    this.featureNotSupported(node, 'product ' + right);
                }

                return [right];

            default:
                this.featureNotSupported(node, 'operator ' + node.operator);
        }
    }
}

module.exports = FilterAWSCompiler;
