"use strict";
var cst = require ("../cst-0.4.9/lib/index");
var tr = require ("estraverse");

exports.wrap = wrap;
function wrap (code, parserOptions) {
code = code.trim();
if (! code) return "";
var parser = new cst.Parser (parserOptions);
var a = parser.parse(code);
var html = "";

a._traverse._tokenIndex._index.CommentBlock.forEach (function (commentNode) {
wrapStatement (commentNode, commentNode.parentElement, commentNode);
});

tr.traverse (a, {
enter: function (node, parent) {
var next = includeNextCommentLine (node);


//console.log ("enter node ", (node)? node.type : "null");
//try {

if (node.type === "BlockStatement" && parent) {
node.insertChildBefore(comment(`{${parent.type}`), node.firstChild.nextSibling);
node.insertChildBefore(comment("}"), node.lastChild);
//console.log (parent.type, node.type);

} else if (parent && (node.isStatement )) {
wrapStatement (node, parent, next);
} // if

//} catch (e) {} // catch


}, // enter

keys: {
BooleanLiteral: [],
CommentBlock: [],
CommentLine: []
}, // keys

/*fallback: function (node) {
if (node.isNonCodeToken) {
return [];
} else {
return Object.keys(node);
} // if
}, // fallback
*/

}); // traverse



function wrapStatement (node, parent, next) {
console.log ("statement: ", node.type, "next: ", (next.type), "parent: ", parent.type);
parent.insertChildBefore(comment("{{"), node);
parent.insertChildBefore(comment("{{{"), node);

if (node.nextSibling) {
parent.insertChildBefore(comment("}}"),next.nextSibling);
} else {
parent.appendChild(comment("}}"));
} // if

if (node.body && node.body.type === "BlockStatement") {
node.insertChildBefore(comment("}}}"), node.body);
} else {
parent.insertChildBefore(comment("}}}"), next.nextSibling);
} // if

//parent.childElements.map(function (e,i) {
//console.log (i, e.type, e.isToken?  e.value : "");
//});

} // wrapStatement

function includeNextCommentLine (node) {
var _node = node;
if (! node || _node.type === "CommentBlock") return node;
do {
_node = _node.nextSibling;
if (! _node) return node;
if (_node.type === "CommentLine") return _node;
} while (_node.type === "Whitespace");
return node;
} // includeNextCommentLine

function comment (value) {return new cst.Token ("CommentBlock", value);}

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

console.log (wrap("/* start */\nwhile (true) {\n/* foo */;\n}"));

/*let fs = require ("fs");
let code = fs.readFileSync ("t.txt", "utf-8");
console.log (wrap (code));
*/
