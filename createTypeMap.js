function createTypeMap (process, text) {
var output = text.append;

return {
Program: function (tree) {
process (tree.body);
output ("\n");
debug (`program: ${text.text.length}`);
}, // Program

VariableDeclaration: function (tree) {
output (tree.kind + " ");
process (tree.declarations, {separator: ", "});
output (";\n");
}, // VariableDeclaration

VariableDeclarator: function (tree) {
process (tree.id);
if (tree.init) {
output (" = ");
process (tree.init);
} // if
}, // VariableDeclarator

WhileStatement: function (tree) {
output ("while ");
output ("(");
process (tree.test);
output (") ");
process (tree.body, {keyword: "while"});
}, // WhileStatement

Test: function (tree) {
process (tree);
}, // Test

CallExpression: function (tree) {
process (tree.callee);
output (" (");
process (tree.arguments);
output (")");
}, // CallExpression

BlockStatement: function (tree, options) {
output ('<button class="toggleBlock">');
output ('<span class="block" style="display:none">');
output ("{\n");
process (tree.body);
output ("}");
if (options.keyword) output (" // " + options.keyword + "\n");
output ('</span><span class="foldMarker">...</span></button>');
}, // BlockStatement

IfStatement: function (tree) {
var keyword = {keyword: "if"};
output ("if (");
process (tree.test);
output (") ");
process (tree.consequent, (tree.alternate)? {} : keyword);

if (tree.alternate) {
output (" else ");
process (tree.alternate, keyword);
} // if
}, // IfStatement

consequent: function (tree, options) {
process (tree.body, options);
}, // consequent

alternate: function (tree, options) {
process (tree.body, options);
}, // alternate

BreakStatement: function (tree) {
output ("break");
if (tree.label) process (tree.label);
output (";\n");
}, // BreakStatement

ExpressionStatement: function (tree) {
process (tree.expression);
output (";\n");
}, // ExpressionStatement

BinaryExpression: function (tree) {
process (tree.left);
output (tree.operator);
process (tree.right);
}, // BinaryExpression


FunctionDeclaration: function (tree) {
var name = "";
output ("function");
if (tree.generator) output ("*");
output (" ");
if (tree.id) name = process (tree.id);
output (" (");
process (tree.params);
output (") ");
process (tree.body, {keyword: name});
}, // FunctionDeclaration

ReturnStatement: function (tree) {
output ("return ");
process (tree.argument);
output (";\n");
}, // ReturnStatement

FunctionExpression: function (tree) {
debug (`type: ${tree.type}: ${JSON.stringify(tree)}`);
return this.FunctionDeclaration (tree);
}, // functionExpression

/*FunctionExpression: function (tree) {
output ("function ");
process (id);
output (" (");
process (params);
output (") ");
}, // FunctionExpression
*/

Identifier: function (tree) {
output (tree.name + " ");
return tree.name;
}, // Identifier

Literal: function (tree) {
output (tree.raw + " ");
return tree.value;
} // Literal
}; // typeMap

/// utilities

function toggleBlock ($block) {

} // toggleBlock
} // createTypeMap
