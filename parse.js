"use strict";
/*var es = require ("./esprima");
var fs = require ("fs");
var text = fs.readFileSync ("t1.txt", "utf-8");
//console.log ("source:\n", text);
console.log ("html:\n", parse(es.tokenize(text), generate().html));
*/

function parse (_tokens, generate) {
var tokens;
if (! generate) throw new Error ("need generator");
if (! _tokens) return null;
tokens = TokenStream (_tokens);

//return transform (_parseBlocks (0, ""), generate);
return generate.program (transform (_parseBlocks (0, ""), generate));

function _parseBlocks (level, label) {
var block = {
type: "Block",
label: label,
level: level,
body: []
}; // block

//console.log ("_parseBlocks: ", level, tokens.index(), tokens.get());

while (!tokens.end() && !tokens.isBlockEnd ()) {
if (tokens.isBlockStart ()) {
tokens.next();
output (_parseBlocks(level+1));

} else {
output (tokens.get());
} // if

tokens.next();
} // while

if (tokens.end() && level !== 0) throw new Error ("Premature end of input reached!");
//tokens.next ();
return block;


function output (x) {
block.body.push (x);
} // output
} // _parseBlocks


/// rewrite

function transform (tree, generate) {
var text = "";
var tokens = TokenStream (tree.body);
var newStatement = true;
//console.log ("transform: ", tree.type, tree.level, tree.body.length + " tokens");
output ("\n");

while (tokens.get()) {
if (newStatement) {
outputWith (generate.statementStart);
outputWith (generate.statementContentStart);
newStatement = false;

// calculate label (primarily for end-of-block comment generation in text output mode)

if (tokens.is ("Keyword", "function")) {
tree.label = (tokens.isToken(tokens.lookahead(), "Identifier"))? 
tokens.lookahead().value
:tokens.get().value;
//console.log ("- function label: ", tree.label);

} else if (tokens.is("Identifier") && tokens.isToken (tokens.lookahead(), "Punctuator")) {
tree.label = tokens.get().value;
//console.log ("- label: possible object assignment = ", tree.label);

} else if (tokens.is("Keyword")) {
tree.label = tokens.get().value;
} // if

} // if

if (tokens.isStatementTerminator ()) {
outputToken (tokens.get(), tokens.lookahead());
outputWith (generate.statementContentEnd);
outputWith(generate.statementEnd);
output ("\n");
newStatement = true;

} else if (isBlock (tokens.get())) {
outputWith (generate.statementContentEnd);

outputWith (generate.block,
"{" + transform (tokens.get(), generate) + "}",
tree.label
); // outputWith

outputWith (generate.statementEnd);
output ("\n");
newStatement = true;

} else {
outputToken (tokens.get(), tokens.lookahead());
} // if

tokens.next();
} // while

return text;

function outputBlockLabel (label) {
if (! label) return "";
var label = TokenStream(label);

while (label.get()) {
outputToken (label.get(), label.lookahead());
} // while
} // outputblockLabel

function outputToken (_token, _nextToken) {
output (_token.value);
if (_nextToken) {
if (
tokens.isStatementTerminator(_nextToken)
|| tokens.is(_token, "Identifier") && includes(_nextToken.value, ["++", "--"])
|| tokens.is(_nextToken, "Identifier") && includes(_token.value, ["++", "--"])
|| includes(_nextToken.value, [")", "]"])
|| includes(_token.value, ["(", "["])
|| (tokens.is(_token, "Identifier") && tokens.is(_nextToken, "Punctuator", "["))
) return;
} // if
output (" ");
} // outputToken

function output (_text) {
text += _text;
} // output

function isBlock (_token) {
return _token && _token.type === "Block";
} // isBlock

function outputWith (f, arg1, arg2) {
return (
(isFunction(f))?
output (f(arg1, arg2))
: ""
); // return
} // outputWith

} // transform


/// lexer

function start (_tokens) {
tokens = _tokens;
index = 0;
} // start

function advanceTo (where) {
if (! where instanceof Array) throw new Error ("AdvanceTo: argument must be array-of-arrays -- " + typeof(where));

while (! test(token())) {
nextToken ();
} // while
if (! test(token())) return null;
return token();

function test (token) {
if (! token) return null;

return where.some ((criteria) => _isToken.apply (null, criteria));
} // test
} // advanceTo


function isLookahead (type, value) {
return _isToken (lookahead(), type, value);
} // isLookahead

function includes (v, a) {
return (a instanceof Array) && a.indexOf(v) >= 0;
} // includes


function isFunction (x) {
return x && (x instanceof Function);
} // isFunction
} // parse


/// Default generators


function generate () {
return {
/// text output
text: {
program: function (content) {
return content + "\n";
}, // program

block: function (content, label) {
//console.log ("text.block: ", label, ", content = ", content);
if (label) label = " // " + label;
return (content + label + "\n");
}, // block

}, // text

/// html output
html: {
program: function (content) {
return (
'<div class="program block">\n'
+ content
+ '</div><!-- .program -->\n'
); // return
}, // program

block: function (content, label) {
return (
'<div class="block">\n'
+ content
+ '</div><!-- .block -->\n'
); // return
}, // block

statementStart: function () {
return '<div class="statement">';
}, // statementStart

statementContentStart: function () {
return '<span class="content">';
}, // statementContentStart

statementContentEnd: function () {
return '</span>';
}, // statementContentEnd

statementEnd: function () {
return '</div><!-- .statement -->';
} // statementEnd
} // html
}; // return
} // generate

function TokenStream (tokens) {
if (! tokens) throw new Error ("TokenStream: null argument given");
if (tokens instanceof Array) tokens = List(tokens);

return {
read: read,
get: tokens.get,
current: tokens.get,
index: tokens.index,
value: function () {return (tokens.get())? tokens.get().value : "";},

next: tokens.next,
end: function () {return (!tokens.isInRange());},

lookahead: function (n) {
if (! n) n = 1;
return tokens.get (tokens.index() + n);
}, // lookahead

isToken: isToken,
is: function (_type, _value) {
return isToken (tokens.get(), _type, _value);
}, // is

isBlockStart: function (_token) {return this.is ("Punctuator", "{", _token);},
isBlockEnd: function (_token) {return this.is ("Punctuator", "}", _token);},

isStatementTerminator: function (_token) {return this.is ("Punctuator", ";", _token);}
}; // Stream

function read (i) {
var text = "";
if (arguments.length === 0) i = tokens.index();
while (tokens.isInRange(i)) {
result += tokens.get(i++).value + " ";
} // while

return result.trim();
} // read

function isToken (_token, type, value) {
//console.log ("_isToken: ", arguments.length, _token.value, type, value);
if (! _token) throw new Error ("TokenStream.isToken: No token.");
if (! _token.type) throw new Error ("Invalid token - type missing.");
//if (! _token.value) throw new Error ("token of type " + _token.type + " must have a value.");
if (! type) throw new Error ("must supply at least type");

if (type !== _token.type) return false;
if (arguments.length < 2 || typeof(value) === "undefined") return true;

return value === _token.value;
} // isToken
} // TokenStream

/// list

function List (items) {
var index = 0;
if (! (items instanceof Array)) throw new Error ("invalid argument -- must be Array");

return {
items: function () {return items;},
length: function () {return items.length;},
index: function () {return (isInRange()? index : -1);},
isInRange: isInRange,
get: get,
next: next,
set: set
}; // return


function next () {
if (isInRange(index)) index += 1;
return get();
} // next

function get (i) {
if (! i) i = index;
return (isInRange(i))? items[i] : null;
} // get

function set (i) {
if (isInRange(i)) {
index = i;
return get ();
} // if

return null;
} // set

function isInRange (i) {
if (arguments.length === 0) i = index;
//console.log ("isInRange: length = ", items.length);
return (i>=0 && i<items.length);
} // isInRange
} // list

