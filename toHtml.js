function toHtml (tree) {
"use strict";
var $html, output, typeMap, text;

text = createText ();
typeMap = createTypeMap ();
function output (_text) {
text.append (_text);
} // output

if (! tree || !(tree instanceof Object)) {
	alert (`argument 1 to toHtml must be a valid esprima AST - must be an object - ${typeof(tree)}`);
	return "";
} // if

process (tree);
return text.value();


function process (tree, _options) {
var options = {
separator: "",
terminator: ";\n",
keyword: "",
alt: null
}; // options
options = Object.assign (options, _options);

if (tree instanceof Array) {
tree.forEach (function (tree, index, values) {
process (tree);
if (options.separator && index < values.length-1) output (options.separator);
}); // forEach

} else {
if (tree.type) {
//debug (`type: ${tree.type}`);
try {
	return typeMap[tree.type] (tree, options);
} catch (e) {
	alert (`unknown type: ${tree.type} / ${typeof(typeMap[tree.type])} / ${typeMap[tree.type] instanceof Function}`);
} // try

} else {
alert (`missing or unknown type: ${tree.type} - ${typeof(typeMap[tree.type])}`);
throw new Error ("missing type");
} // if
} // if
} // process


/// type map

function createTypeMap () {
return {
Program: function (tree) {
output ('<div class="program item">\n');
output ('<div class="block">\n');
output ('<span class="content">\n');
process (tree.body);
output ("\n");
output ('</span>\n');

output ('<span class="fold-marker">...</span>\n');
}, // Program

VariableDeclaration: function (tree) {
output ('<div class="var item">\n');
output (tree.kind + " ");
process (tree.declarations, {separator: ", "});
output (";\n");
output ('</div><!-- var -->\n');
}, // VariableDeclaration

VariableDeclarator: function (tree, options) {
process (tree.id);
if (tree.init) {
output (" = ");
process (tree.init);
} // if
}, // VariableDeclarator

WhileStatement: function (tree) {
output ('<div class="while item">');
output ('<div class="fold-trigger">');
output ("while ");
output ("(");
process (tree.test);
output (") ");
process (tree.body, {keyword: "while"});
output ('</div><!-- while -->\n');
}, // WhileStatement

ForStatement: function (tree) {
output ('<div class="for item">');
output ('<div class="fold-trigger">');
output ("for ");
output ("(");
process (tree.init);
output ("; ");
process (tree.test);
output ("; ");
process (tree.update);
output (") ");
process (tree.body, {keyword: "for"});
output ('</div><!-- for -->\n');
}, // ForStatement

Test: function (tree) {
process (tree);
}, // Test

CallExpression: function (tree) {
process (tree.callee);
output (" (");
process (tree.arguments);
output (")");
}, // CallExpression

MemberExpression: function (tree, options) {
	process (tree.object, options);

	if (tree.computed) {
		output ("[");
		process (tree.property);
		output ("]");
		
	} else {
		output (".");
		process (tree.property, options);
	} // if
	
}, // MemberExpression

LogicalExpression: function (tree, options) {
process (tree.left);
output (tree.operator);
process (tree.right);
}, // LogicalExpression

BlockStatement: function (tree, options) {
output ('</div>');
output ('<div class="block">');
output ('<span class="content">');
output ("{\n");
process (tree.body);
output ("}");
if (options.keyword) output (" // " + options.keyword + "\n\n");
output ('</span>');
output ('<span class="fold-marker hidden">...\n</span>');

output ('</div>');
}, // BlockStatement

IfStatement: function (tree, options) {
output ('<div class="if item">\n');
var keyword = {keyword: "if"};
if (! options.alternate) output ('<div class="fold-trigger">');
output ("if (");
process (tree.test);
output (") ");

process (tree.consequent, (tree.alternate)? {} : keyword);

if (tree.alternate) {
output ('<div class="fold-trigger">');
output (" else ");
keyword.alternate = true;
process (tree.alternate, keyword);
} // if

output ('</div><!-- if -->\n');
}, // IfStatement

consequent: function (tree, options) {
process (tree.body, options);
}, // consequent

alternate: function (tree, options) {
process (tree.body, options);
}, // alternate

BreakStatement: function (tree) {
output ('<div class="break item">\n');
output ("break");
if (tree.label) process (tree.label);
output (";\n");
output ('</div><!-- break -->\n');
}, // BreakStatement

ExpressionStatement: function (tree) {
output ('<div class="expression-statement item">\n');
process (tree.expression);
output (";\n");
output ('</div><!-- expression-statement -->\n');
}, // ExpressionStatement

BinaryExpression: function (tree) {
if (tree.left.type !== "BinaryExpression" && tree.left.type !== "UnaryExpression") 
output ("(");

process (tree.left);
output (tree.operator);
process (tree.right);

if (tree.right.type !== "BinaryExpression" && tree.right.type !== "UnaryExpression") 
output (")");
}, // BinaryExpression


FunctionDeclaration: function (tree) {
var name = "";
output ('<div class="function item">\n');
output ('<div class="fold-trigger">');
output ("function");
if (tree.generator) output ("*");
output (" ");
if (tree.id) name = process (tree.id);
output (" (");
process (tree.params);
output (") ");
process (tree.body, {keyword: name});
output ('</div><!-- function -->\n');
}, // FunctionDeclaration

ReturnStatement: function (tree) {
output ('<div class="return item">\n');
output ("return ");
process (tree.argument);
output (";\n");
output ('</div><!-- return -->\n');
}, // ReturnStatement

FunctionExpression: function (tree) {
return this.FunctionDeclaration (tree);
}, // functionExpression

ObjectExpression: function (tree, options) {
output ('<div class="object-literal item">\n');
output ("{");
if (tree.properties.length > 2) {
options = Object.assign (options, {separator: ",\n"});
output ("\n");
} // if

process (tree.properties, options);
//if (tree.properties.length > 2) output ("\n");
output ("}");
output ('</div><!-- object-literal -->\n');
}, // ObjectExpression

Property: function (tree, options) {
process (tree.key, options);
output (": ");
process (tree.value, options);
}, // Property

ArrayExpression: function (tree, options) {
output ("[");
process (tree.elements);
output ("]");
}, // ArrayExpression

AssignmentExpression: function (tree, options) {
process (tree.left);
output (" " + tree.operator + " ");
process (tree.right);
}, // AssignmentExpression

UpdateExpression: function (tree, options) {
if (tree.prefix) output (tree.operator);
process (tree.argument);
if (! tree.prefix) output (tree.operator);
}, // UpdateExpression

Identifier: function (tree) {
output (tree.name + " ");
return tree.name;
}, // Identifier

Literal: function (tree) {
output (tree.raw + " ");
return tree.value;
} // Literal
}; // typeMap
} // createTypeMap


/// output

function createText () {
return {
text: "",
stack: [],
value: function () {return this.text;},

/*save: function () {
this.stack.push (this.text);
this.text = "";
}, // save

restore: function () {
var _text = this.text;
this.text = this.stack.pop();
return _text;
}, // restore

clear: function () {
this.text = "";
}, // clear
*/

append: function (_text) {
this.text += (_text);
//debug (`text.append: ${_text.length} ${this.text.length}`);

function escapeHtml (html) {
html = html.replace ("&", "&amp;");
html = html.replace ("<", "&lt;");
html = html.replace (">", "&gt;");
return html;
} // escapeHtml
} // append
}; // text
} // createText

} // toHtml
