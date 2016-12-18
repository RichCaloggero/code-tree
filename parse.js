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


result = parse(tokens, generate().html);

console.log (`Processing ${tokens.length} tokens:\n`,
//util.inspect (
result[0] == " ", result
//, {depth: null, breakLength: 3})
, "\nDone.\n"
);

function parse (_tokens, generate) {
var tokens;
if (! generate) throw new Error ("need generator");
if (! _tokens) return null;
tokens = TokenStream (_tokens);

return transform (_parseBlocks (0, ""), generate);

function _parseBlocks (level, label) {
var block = {
type: "Block",
label: label,
level: level,
body: []
}; // block

//console.log ("_parseBlocks: ", level, index);

while (!tokens.end() && !tokens.isBlockEnd ()) {
if (
tokens.isBlockStart ()
// || tokens.isBlockLabel () 
) {
tokens.next();
output (_parseBlocks(level+1, label));

} else {
output (tokens.get());
} // if

tokens.next();
} // while

if (tokens.end() && level !== 0) throw new Error ("Premature end of input reached!");
tokens.next ();
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

while (tokens.get()) {
if (newStatement) {
outputWith (generate.statementStart);
newStatement = false;
} // if

if (isBlock (tokens.get())) {
outputWith (generate.blockContentStart);
output (transform (tokens.get(), generate));
outputWith (generate.blockContentEnd);

} else if (tokens.isStatementTerminator ()) {
outputWith(generate.statementEnd);
output ("\n");
newStatement = true;

} else {
outputToken (tokens.get(), tokens.lookahead());
} // if

tokens.next();
} // while

outputWith (generate.statementEnd);
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

function outputWith (f, s) {
return (isFunction(f))? output (f(s))
: "";
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



/// token stream

function TokenStream (tokens) {
if (! tokens) throw new Error ("TokenStream: null argument given");
if (tokens instanceof Array) tokens = List(tokens);

return {
get: tokens.get,
next: tokens.next,
end: function () {return (!tokens.isInRange());},

lookahead: function (n) {
if (! n) n = 1;
return tokens.get (tokens.index() + n);
}, // lookahead

is: function (_token, _type, _value) {
return isToken (_token || tokens.get(), _type, _value);
}, // is

isBlockStart: function (_token) {return this.is (_token, "Punctuator", "{");},
isBlockEnd: function (_token) {return this.is (_token, "Punctuator", "}");},

isBlockLabel: function (_token) {
return (
this.is (_token, "Keyword")
|| this.is (_token, "Identifier")
); // return
}, // isBlockLabel

isStatementTerminator: function (_token) {return this.is (_token, "Punctuator", ";");}
}; // Stream

function isToken (_token, type, value) {
//console.log ("_isToken: ", arguments.length, _token.value, type, value);
if (! _token) throw new Error ("TokenStream.isToken: No token.");
if (! _token.type) throw new Error ("Invalid token - type missing.");
//if (! _token.value) throw new Error ("token of type " + _token.type + " must have a value.");
if (! type) throw new Error ("_isToken: must supply at least type");

if (type !== _token.type) return false;
if (arguments.length < 2 || typeof(value) === "undefined") return true;

return value === _token.value;
} // isToken
} // TokenStream

/// list

function List (items) {
var index = 0;

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
return (i>=0 && i<items.length);
} // isInRange
} // list

function generate () {
return {
/// text output
text: {
	statementEnd: function () {
		return ";";
	}, // statementEnd

blockLabel: function (text) {
		return text;
	}, // blockLabel

blockContentStart: function () {
		return "{\n";
	}, // blockContentStart

	blockContentEnd: function (label) {
		var text = "}";
		if (label) text += " // " + label;
		return text;
	} // blockContentEnd
}, // text

/// html output
html: {
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

	blockContentStart: function (program) {
var type = (program)? "program" : "block";
return '<div class="' + type + ' content">'
+ '<div class="folded">{...}</div>'
+ '<div class="unfolded">';
	}, // blockStart
	
	blockContentEnd: function (label) {
		var comment = "";
		if (label) comment += " // " + label + "\n";
		return comment
		+ '</div><!-- .unfolded -->'
		+ '</div><!-- .block.content -->';
		} // blockEnd
} // html
}; // return
} // generate
