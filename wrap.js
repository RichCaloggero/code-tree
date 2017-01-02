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

var comments = a._traverse._tokenIndex._index.CommentBlock;
if (comments) comments.forEach (function (commentNode) {
wrapStatement (commentNode, commentNode.parentElement, commentNode);
});

comments = a._traverse._tokenIndex._index.CommentLine;
if (comments) comments.forEach (function (commentNode) {
var node = commentNode.previousSibling;
while (node && node.type === "Whitespace" && !isNewline(node.value)) {
//console.log (node? [node.type, node.value] : "null");
node = node.previousSibling;
} // while
//console.log ("stop: ", node? [node.type, node.value] : "null");
if (!node || (node.type === "Whitespace" && isNewline(node.value))) {
wrapStatement (commentNode, commentNode.parentElement, commentNode);
//console.log ("wrapping ", commentNode.type, commentNode.value);
} // if
}); // forEach CommentLine

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
if (node.body && node.body.type !== "BlockStatement") this.skip();
} // if

//} catch (e) {} // catch
}, // enter

keys: {
NumericLiteral: [],
BooleanLiteral: [],
StringLiteral: [],
RegExpLiteral: [],
ObjectProperty: [],
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
var _node = node.nextSibling;
while (_node && _node.type === "Whitespace" && !isNewline(_node.value)) _node = _node.nextSibling;
if (_node && _node.type === "CommentLine") return _node;
return node;
} // includeNextCommentLine

function comment (value) {return new cst.Token ("CommentBlock", value);}
function isNewline (s) {return s && s.charAt(0) === "\n";}

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

/*console.log (wrap(`
while (true) foo();
bar();
`));
*/

/*let fs = require ("fs");
let code = fs.readFileSync ("wrap.js", "utf-8");
let html = wrap (code);
//console.log (html);
*/
