"use strict";

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


var a = esprima.parse(code, {range:true, comments: true, attachComments: true});
//console.log (util.inspect(a, {depth:null}));
console.log (esgen .generate(a, {comment:true}));
process.exit(1);


tr.traverse (a, {
enter: function (node, parent) {
var pre, post;

if (node.type === "BlockStatement" ) {
// want to wrap the statements within the block in html tags
pre = `<div class="block ${parent.type}">\n`;
post = `</div>\n`;
data.push ({
name: "block",
node: node, parent: parent,
});
result = wrap (code, node.range, "/*{*/", "/*}*/");
console.log ("wrapped ", parent.type, node.range);
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
console.log (result);

