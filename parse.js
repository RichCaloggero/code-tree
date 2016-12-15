"use strict";
var util = require ("util");
var es = require ("./esprima");
var result;
var tokens = es.tokenize (`
var x, y;
while (x < (y+z)) {
--x[7];
y++;
x += x / y * x+y;
}
`);

/// text output
var generateText = {
	blockTitle: function (text) {
		return text;
	}, // blockTitle

blockStart: function () {
		return "{\n";
	}, // blockStart
	blockEnd: function (title) {
		var text = "}";
		if (title) text += " // " + title;
		return text;
	} // blockEnd
}; // generateText

/// html output
/* should look like this:
<div class="block">
<div class="block header">
while (test())
</div><!-- .block.header -->
<div class="block content">
<div class="folded">{...}</div>
<div class="unfolded content">
... program text (may include other block specifications) ...
</div>
</div></div>
*/

var generateHtml = {
	blockTitleStart: function (text) {
		return '<div class="block header">';
	}, // blockTitleStart
	
		blockTitleEnd: function (text) {
		return '</div><!-- .block.header -->';
	}, // blockTitleEnd

	blockStart: function () {
return '<div class="block content">'
+ '<div class="folded">{...}</div>'
+ '<div class="unfolded">';
	}, // blockStart
	
	blockEnd: function (title) {
		var comment = "";
		if (title) comment += " // " + title + "\n";
		return comment
		+ '</div><!-- .unfolded -->'
		+ '</div><!-- .block.content -->'
		+ '</div><!-- .block -->';
	} // blockEnd
}; // generateHtml

console.log ("global: ", generateText);


result = parse(tokens, generateText);

console.log (`Processing ${tokens.length} tokens:\n`,
//util.inspect (
result[0] == " ", result
//, {depth: null, breakLength: 3})
, "\nDone.\n"
);

function parse (tokens, generate) {
var index = 0;
if (! tokens) return null;
console.log ("parse: ", generate);

return transform (_parseBlocks (0, ""), generate);

function _parseBlocks (level, title) {
var node = {
type: "Block",
title: title,
level: level,
index: index,
body: []
}; // node

//console.log ("_parseBlocks: ", level, index);

while (! isEndOfInput() && !isBlockEnd()) {
if (
isBlockTitle ()
|| isBlockStart ()
) {
startBlock ();

} else {
output (token());
} // if

nextToken ();
} // while
return endBlock ();


function output (x) {
node.body.push (x);
} // output

function startBlock () {
var title;
if (isBlockTitle()) {
title = processBlockTitle ();
//console.log ("- resulting tokens: ", node.body.length);
if (! title) return;
} // if

nextToken ();
output (_parseBlocks(level+1, title));

function processBlockTitle () {
var _token = token();
var text = token().value;
var chunk = [];

//console.log ("- looking for block title...");
if (isToken ("Identifier", "function") && isLookahead("Identifier")) text += (" " + lookahead().value);
//console.log ("- text: ", text);

while (!isBlockStart() && !isStatementTerminator()) {
chunk.push (token());
nextToken ();
} // while
//console.log ("- scan: ", chunk.length);

if (isBlockStart()) {
//console.log ("- found block title");
return blockTitle (text, chunk);
} // if

//if (isStatementTerminator()) {
//console.log ("- concat ", node.body.length, chunk.length);
node.body = node.body.concat (chunk, token());
//} // if
return null;

function blockTitle (text, tokens) {
return {text: text, body: tokens};
} // blockTitle
} // processBlockTitle
} // startBlock

function endBlock () {
//console.log ("endBlock: ", level, token());
if (isEndOfInput() && level !== 0) throw new Error ("Premature end of input reached!");
//console.log ("- [end-of-block]");
nextToken ();
return node;
} // endBlock
} // _parseBlocks

/// qualifiers

function isBlockTitle (_token) {
_token = _token || token();
return _isToken (_token, "Keyword") || _isToken (_token, "Identifier", "function");
} // isBlockTitle

function isBlockStart (_token) {
return _isToken (_token || token(), "Punctuator", "{");
} // isBlockStart

function isBlockEnd (_token) {
return _isToken (_token || token(), "Punctuator", "}");
} // isBlockEnd

function isStatementTerminator (_token) {
return _isToken (_token || token(), "Punctuator", ";");
} // isStatementTerminator 



/// rewrite

function transform (tree, generate) {
var text = "";
var index = 0;
var token;
console.log ("transform: ", generate);

for (index=0; index<tree.body.length; index++) {
token = tree.body[index];
//console.log ("- token: ", text.length, token);

if (isBlock (token)) {
outputBlock (token, generate);

} else if (isStatementTerminator (token)) {
endStatement (token, generate);

} else {
//console.log ("- else: ", token);
outputToken (token, lookahead());

} // if

} // while
return text;

function outputBlock (block, generate) {
console.log ("outputBlock: ", util.inspect(block.title, {depth: null, breakLength: 3}));
if (block.title && block.title.body.length > 0) {
console.log ("- found title ", block.title.text);
//if (generate && isFunction(generate.blockTitleStart)) output (generate.blockTitleStart (block.title.text));
if (generate && isFunction(generate.blockTitle)) output (generate.blockTitle(transform (block.title, generate)));
//if (generate && isFunction(generate.blockTitleEnd)) output (generate.blockTitleEnd ());
} // if

if (generate && isFunction(generate.blockStart)) output (generate.blockStart());
output (transform (block, generate));
if (generate && isFunction(generate.blockEnd)) output (generate.blockEnd (block.title && block.title.text));

output ("\n");
} // outputBlock

function endStatement (_token, type) {
output (_token.value);
output ("\n");
} // endStatement

function outputToken (_token, _nextToken) {
output (_token.value);
if (_nextToken) {
if (
isStatementTerminator(_nextToken)
|| _isToken(_token, "Identifier") && includes(_nextToken.value, ["++", "--"])
|| _isToken(_nextToken, "Identifier") && includes(_token.value, ["++", "--"])
|| includes(_nextToken.value, [")", "]"])
|| includes(_token.value, ["(", "["])
|| (_isToken (_token, "Identifier") && _isToken (_nextToken, "Punctuator", "["))
) return;
} // if
output (" ");
} // outputToken

function lookahead () {
return (index < tree.body.length-1)? tree.body[index+1] : null;
} // lookahead

function output (_text) {
text += _text;
} // output

function isBlock (_token) {
return _token.type === "Block";
} // isBlock
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

function isToken (type, value) {
return _isToken (token(), type, value);
} // isToken

function isLookahead (type, value) {
return _isToken (lookahead(), type, value);
} // isLookahead

function _isToken (_token, type, value) {
//console.log ("_isToken: ", arguments.length, _token.value, type, value);
if (! _token) throw new Error ("No token.");
if (! _token.type) throw new Error ("Invalid token - type missing.");
if (! _token.value) throw new Error ("token of type " + _token.type + " must have a value.");
if (! type) throw new Error ("_isToken: must supply at least type");

if (type !== _token.type) return false;
if (arguments.length < 2 || typeof(value) === "undefined") return true;

return value === _token.value;
} // isToken

function token () {
if (! tokens || index < 0 || isEndOfInput()) return null;
return Object.assign ({index: index}, tokens[index]);
} // token

function nextToken () {
if (isEndOfInput ()) return null;
index += 1;
return token ();
} // nextToken

function lookahead () {
if (isEndOfInput (index+1)) return null;
return tokens[index+1];
} // lookAhead

function isEndOfInput (_index) {
if (arguments.length === 0) _index = index;
return _index >= tokens.length;
} // isEndOfInput

function includes (v, a) {
return (a instanceof Array) && a.indexOf(v) >= 0;
} // includes

function isFunction (x) {
	return x && (x instanceof Function);
} // isFunction
} // parse





/*var fs = require ("fs");
var t = fs.readFileSync ("./t.js");
var p = es.tokenize (t);
//console.log (
tree (p)
);
*/
