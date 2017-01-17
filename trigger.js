"use strict";
var cst = require ("cst");
var tr = require ("estraverse");

exports.annotate = annotate;
function annotate (code, parserOptions) {
code = code.trim();
if (! code) return "";
var parser = new cst.Parser (parserOptions);
var a = parser.parse(code);
var html = "";

var comments = a._traverse._tokenIndex._index.CommentBlock;
if (comments) comments.forEach (function (commentNode) {
wrapStatement (commentNode);
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
wrapStatement (commentNode);
//console.log ("wrapping ", commentNode.type, commentNode.value);
} // if
}); // forEach CommentLine

tr.traverse (a, {
enter: function (node, parent) {
//console.log ("enter node ", (node)? node.type : "null");

if (isBlock(node) && parent) {
startBlock (node, parent);
} // if
}, // enter

leave: function (node, parent) {
if (isBlock(node) && parent) {
endBlock (node, parent);
} // if
}, // leave

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

function wrapStatement (node) {
var parent = node.parentElement;
startStatement (node, parent);
endStatement (node, parent);
} // wrapStatement

function startBlock (node, parent) {
var start;
console.log ("BlockStatement ", node.getSourceCode());
// insert start block marker after open brace
node.insertChildBefore(annotation(`{${parent.type}`), node.firstChild.nextSibling);

// trigger will be content of parent node, until open brace
parent.parentElement.insertChildBefore (annotation("{{"), parent);
parent.insertChildBefore (annotation("}}"), node);
} // startBlock

function endBlock (node, parent) {
// insert end block marker before close brace
node.insertChildBefore(annotation("}"), node.lastChild);
} // endBlock

function append (_annotation, node) {
var parent;
if (! node) return;

do {
parent = node.parentElement;
console.log (`append: node = ${query(node)}
parent = ${query(node.parentElement)}
next = ${query(node.nextSibling)}
`);

if (node.nextSibling) {
parent.insertChildBefore (_annotation, node.nextSibling);
console.log ("- before nextSibling");
return;
} // if

if (isTopLevel(node)) {
parent.insertChildBefore (_annotation, parent.getLastToken());
return;
} // if

console.log ("- moovin on up...");
node = parent;
} while (node);

console.log ("- append failed");
} // append

function query (node) {
if (! node) return("null");
else return((node.isToken)? [node.type, node.value] : node.type);
} // query

function hasBlockContent (node) {
return node && (isBlock(node.body) || isBlock(node.consequent) || isBlock(node.alternate));
} // hasBlockContent

function isBlock (node) {return node && node.type === "BlockStatement";}

function isInsideBlock (node) {return node && node.parentElement && node.parentElement.type === "BlockStatement";}
function isInsideElseClause (node, parent) {
return (
(node.type === "BlockStatement")?
parent && parent.type === "IfStatement" && parent.alternate === node
: parent.parentElement && parent.parentElement.type === "IfStatement" && parent.parentElement.alternate === parent
); // return
} // insideElseClause

function isTopLevel (node) {return node && node.parentElement && node.parentElement.type === "Program";}

function skipWhitespace (node, next, breakOn) {
while (node && node.type === "Whitespace") {
if (node.value && node.value.indexOf(breakOn) >= 0) return node;
node = node[next];
} // while

return node;
} // skipWhitespace

function showToken (t) {console.log ((t)? [t.type, t.value] : "null");} // showToken

function includeNextCommentLine (node) {
var _node = node.nextSibling;
_node = skipWhitespace (_node, "nextSibling", "\n");
if (_node && _node.type === "CommentLine") return _node;
return node;
} // includeNextCommentLine

function annotation () {
var result = [];
var token;
for (var i=0; i<arguments.length; i++) {
token = comment(arguments[i]);
result = result.concat(token);
} // for
return result;
} // annotation

function comment (value) {
return [
new cst.Token ("CommentBlock", value),
new cst.Token ("Whitespace", "\n")
]; // return
} // comment

function isIfStatement (node) {return node && node.type === "IfStatement";}

function isNewline (s) {return s && s.charAt(0) === "\n";}

return toHtml (a.getSourceCode());

function toHtml (code) {
var html = code;
/*// statement content
html = html.replace (/\/\*\{\{\{\*\//g, '<div class="content">');
html = html.replace (/\/\*\}\}\}\*\//g, '</div><!-- .content -->');

// statements
html = html.replace (/\/\*\{\{\*\//g, '<div class="statement">');
html = html.replace (/\/\*\}\}\*\//g, '</div><!-- .statement -->');

// blocks
html = html.replace (/\/\*\{(.*?)\*\//g, '<div class="block $1">');
html = html.replace (/\/\*\}\*\//g, '</div><!-- .block -->');
*/
return '<div class="program block">\n' + html + '\n</div><!-- .Program -->\n';
} // toHtml
} // annotate

console.log (annotate(`
if (t1) {true;} else {false;}
`));

/*let fs = require ("fs");
let code = fs.readFileSync ("wrap.js", "utf-8");
let html = wrap (code);
//console.log (html);
*/
