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
	statementEnd: function () {
		return ";";
	}, // statementEnd

blockLabel: function (text) {
		return text;
	}, // blockLabel

blockStart: function () {
		return "{\n";
	}, // blockStart
	blockEnd: function (label) {
		var text = "}";
		if (label) text += " // " + label;
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
	nodeStart: function () {
		return '<div class="node">';
	}, // nodeStart


	nodeEnd: function () {
		return '</div><!-- .node -->';
	}, // nodeStart

	statementStart: function () {
		return '<div class="statement">';
	}, // statementStart

	statementEnd: function () {
		return '</div><!-- .statement -->';
	}, // statementStart

	blockLabel: function (text) {
		return '<div class="block header">'
+ text
+ '</div><!-- .block.header -->';
	}, // blockLabel

	blockStart: function () {
return '<div class="block content">'
+ '<div class="folded">{...}</div>'
+ '<div class="unfolded">';
	}, // blockStart
	
	blockEnd: function (label) {
		var comment = "";
		if (label) comment += " // " + label + "\n";
		return comment
		+ '</div><!-- .unfolded -->'
		+ '</div><!-- .block.content -->'
		+ '</div><!-- .block -->';
	} // blockEnd
}; // generateHtml



result = parse(tokens, generateHtml);

console.log (`Processing ${tokens.length} tokens:\n`,
//util.inspect (
result[0] == " ", result
//, {depth: null, breakLength: 3})
, "\nDone.\n"
);

function parse (tokens, generate) {
var index = 0;
if (! generate) throw new Error ("need generator");
if (! tokens) return null;

return transform (_parseBlocks (0, ""), generate);

function _parseBlocks (level, label) {
var node = {
type: "Block",
label: label,
level: level,
index: index,
body: []
}; // node

//console.log ("_parseBlocks: ", level, index);

while (! isEndOfInput() && !isBlockEnd()) {
if (
isBlockLabel ()
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
var label;
if (isBlockLabel()) {
label = processBlockLabel ();
//console.log ("- resulting tokens: ", node.body.length);
if (! label) return;
} // if

nextToken ();
output (_parseBlocks(level+1, label));

function processBlockLabel () {
var _token = token();
var text = token().value;
var chunk = [];

//console.log ("- looking for block label...");
if (isToken ("Identifier", "function") && isLookahead("Identifier")) text += (" " + lookahead().value);
//console.log ("- text: ", text);

while (!isBlockStart() && !isStatementTerminator()) {
chunk.push (token());
nextToken ();
} // while
//console.log ("- scan: ", chunk.length);

if (isBlockStart()) {
//console.log ("- found block label");
return blockLabel (text, chunk);
} // if

//if (isStatementTerminator()) {
//console.log ("- concat ", node.body.length, chunk.length);
node.body = node.body.concat (chunk, token());
//} // if
return null;

function blockLabel (text, tokens) {
return {text: text, body: tokens};
} // blockLabel
} // processBlockLabel
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

function isBlockLabel (_token) {
_token = _token || token();
return _isToken (_token, "Keyword") || _isToken (_token, "Identifier", "function");
} // isBlockLabel

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
if (isFunction (generate.nodeStart)) output(generate.nodeStart());
output(do(generate.nodeStart()));
output(do(generate.statementStart()));
if (tree.label && isFunction(generate.blockLabel)) output(generate.blockLabel(outputBlockLabel(tree.label)));

for (index=0; index<tree.body.length; index++) {
token = tree.body[index];
//console.log ("- token: ", text.length, token);

/*if (statementStart) {
output(do(generate.statementStart()));
statementStart = false;
} // if
*/

if (isBlock (token)) {
output (transform (token, generate));
//statementStart = true;

} else if (isStatementTerminator (token)) {
endStatement (token, generate);
//statementStart = true;

} else {
outputToken (token, lookahead());

} // if

} // while

output(do(generate.nodeEnd()));
return text;

function outputBlockLabel (label) {
if (! label) return "";
for (var i=0; i<label.body.length; i++) {
outputToken (
label.body[i],
(i<label.body.length-1)? label.body[i+1] : null
);
} // for
} // outputblockLabel

function outputBlock (block, generate) {

output (do(generate.blockStart()));
output (transform (block, generate));
output (do(generate.blockEnd (block.label && block.label.text)));

output ("\n");
} // outputBlock

function endStatement (_token, generate) {
output(do(generate.statementEnd()));
output ("\n");
output(do(generate.statementStart()));
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




/// list

"use strict";


function list (items) {
return {
items: items,
index: 0,

get: function (i) {
if (! i) i = this.index;
return (this.isInRange(i))? this.items[i]
: null;
}, // get

next: function () {
if (this.isInRange(this.index)) this.index += 1;
return this.get();
}, // next

set: function (i) {
if (this.isInRange(i)) {
this.index = i;
return get ();
} // if

return null;
}, // set


lookahead: function (n) {
if (! n) n = 1;
return this.get (this.index + n);
}, // lookahead

isInRange: function (i) {return (i>=0 && i<this.items.length);},
}; // return
} // list

