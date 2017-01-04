"use strict";
var cst = require ("cst");
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
//try {

if (node.type === "BlockStatement" && parent) {
startBlock (node, parent);

} else if (node.isStatement && parent) {
startStatement (node, parent);
} // if

//} catch (e) {} // catch
}, // enter

leave: function (node, parent) {
if (node.type === "BlockStatement") {
endBlock (node, parent);

} else if (node.isStatement && parent) {
endStatement (node, parent, "bindComment");
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
} // startBlock

function endBlock (node, parent) {
// insert end block marker before close brace
node.insertChildBefore(annotation("}"), node.lastChild);
} // endBlock

function startStatement (node, parent) {
//console.log ("startStatement: token=");
//showToken (node.getFirstToken());
//console.log ("start statement: ", node.type, " parent: ", parent.type);
if (isInsideBlock(node) || isTopLevel(node)) parent.insertChildBefore (annotation("{{", "{{{"), node);

if (isIfStatement(node)) {
console.log ("isIfStatement: ", node.type);
if (isBlock(node.consequent)) node.insertChildBefore (annotation("}}}"), node.consequent);

if (node.alternate) {
// split into two statements
node.insertChildBefore (annotation("}}", "{{", "{{{"), node.alternate);
} // if

} else if (hasBlockContent(node)) {
console.log ("hasBlockContent: ", node.type);
node.insertChildBefore (annotation("}}}"), node.body);
parent.insertChildBefore (annotation("}}"), node.nextSibling);
} // if
} // startStatement

function endStatement (node, parent, bindComment) {
var next;
next = (bindComment)? includeNextCommentLine (node) : node;

//console.log ("endStatement: ", node.type, parent.type);
//console.log ("- ", node.getSourceCode());
//showToken (node.getLastToken());
if (isInsideBlock(node) ) {
//console.log ("- nextSibling: ", node.nextSibling && node.nextSibling.type);
//console.log ("- next: ", next && next.type);
if (next.nextSibling && next.nextSibling.type !== "EOF") {
console.log ("- insertChildBefore...");
parent.insertChildBefore(annotation("}}}", "}}"),next.nextSibling);
} else {
console.log ("- appendChild");
//else next.parent.appendChild(annotation("}}"));
} // if
} // if

if (isTopLevel(node) && node.nextSibling === null) parent.insertChildBefore(annotation("}}}", "}}"), parent.getLastToken());


//parent.childElements.map(function (e,i) {
//console.log (i, e.type, e.isToken?  e.value : "");
//});
} // endStatement

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

console.log (wrap(`
while (true) {true;}
wrap();
`));

/*let fs = require ("fs");
let code = fs.readFileSync ("wrap.js", "utf-8");
let html = wrap (code);
//console.log (html);
*/
