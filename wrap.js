"use strict";
var cst = require ("../cst-0.4.9/lib/index");
var tr = require ("estraverse");

exports.wrap = wrap;
function wrap (code) {
var parser = new cst.Parser ();

if (! code) code = `
var x;
while (true) {
doSomething(x);
}

function f(x) {
while (whatever()) {
doThisThing();
}
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

}, // enter

/*keys: {
targetNodeName: ["NumericLiteral", "BooleanLiteral"]
}, // keys
*/
fallback: function (node) {
return Object.keys(node).filter (function (key) {
node.key && node.key.type && node.key.type !== "BooleanLiteral";
}); // filter
}, // fallback

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

return '<div class="program block">\n' + html + '\n</div><!-- .Program -->\n';
} // wrap

//console.log (wrap());
