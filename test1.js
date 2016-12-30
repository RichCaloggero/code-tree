"use strict";

var cst = require ("../cst-0.4.9/lib/index");
var parser = new cst.Parser ({strictMode: false});
var esprima = require ("esprima");
var esgen = require ("escodegen");
var tr = require ("estraverse");
var util = require ("util");
var data = [];
var visited = new Set();

/* block comment */
var code = `
var x; // simple
while (x) {
f(x);
}

// cool
function f(x) {return x*x;}
`;
var result = "";


var a = parser.parse(code);


tr.traverse (a, {
enter: function (node, parent) {
var pre, post;

if (node.type === "BlockStatement" ) {
// want to wrap the statements within the block in html tags
pre = new cst.Token("CommentBlock", `{${parent.type}`);
post = new cst.Token("CommentBlock", "}");
//node.prependChild (pre, node.firstChild);
//node.apendChild (post, node.lastChild);
console.log (parent.type, node.type);
} // if


function literal(_html) {
return {type: "Literal", value: 42, raw: _html};
} // literal

function comment (_html) {
return {type: "Line", value: _html, raw: _html};
} // comment

} // enter
}); // traverse


function wrap (code, range, pre, post) {
var s1,s2,s3;

s1 = code.slice (0,range[0]);
s2 = code.slice (range[0], range[1]+1);
s3 = code.slice (range[1]+1, code.length);
//console.log ("s1: ", s1, "\ns2: ", s2, "\ns3: ", s3);
return s1 + pre + s2 + post + s3;
} // wrap

//console.log (util.inspect(a, null, 4));
//console.log (esgen.generate (a, {comment: true, parse: esprima.parse, verbatim: "raw"}));
//console.log (result);

