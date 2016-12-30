"use strict";

var cst = require ("../cst-0.4.9/lib/index");
var parser = new cst.Parser ();
var esprima = require ("esprima");
var tr = require ("estraverse");
var util = require ("util");

var code = `
while (x) {
f();
}
`;

var a = parser.parse(code);

var html = "";

tr.traverse (a, {
enter: function (node, parent) {
var pre, post;
//console.log (node.type, node.isStatement);
//try {

if (node.type === "BlockStatement" ) {
parent.insertChildBefore(comment("}}}"), node);
node.insertChildBefore(comment(`{${parent.type}`), node.firstChild.nextSibling);
node.insertChildBefore(comment("}"), node.lastChild);
//console.log (parent.type, node.type);

} else if (node.isStatement  && parent) {
//console.log ("statement: ", node.type, "parent: ", parent.type);
parent.insertChildBefore(comment("{{"), node);
parent.insertChildBefore(comment("{{{"), node);

parent.insertChildBefore(comment("}}"),node.nextSibling);
if (!node.body || node.body.type !== "BlockStatement") parent.insertChildBefore(comment("}}}"), node.nextSibling);

//parent.childElements.map(function (e,i) {
//console.log (i, e.type, e.isToken?  e.value : "");
//});
} // if

//} catch (e) {} // catch

function comment (value) {return new cst.Token ("CommentBlock", value);}

} // enter
}); // traverse

html = a.getSourceCode ();

// statement content
html = html.replace (/\/\*\{\{\{\*\//g, '<div class="content">');
html = html.replace (/\/\*\}\}\}\*\//g, '</div><!-- .content -->');

// statements
html = html.replace (/\/\*\{\{\*\//g, '<div class="statement">');
html = html.replace (/\/\*\}\}\*\//g, '</div><!-- .statement -->');

// blocks
html = html.replace (/\/\*\{(.*?)\*\//g, '<div class="block $1">');
html = html.replace (/\/\*\}\*\//g, '</div><!-- .block -->');

console.log (html);
