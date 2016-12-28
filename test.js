"use strict";

var esprima = require ("esprima");
var esgen = require ("escodegen");
var tr = require ("estraverse");
var util = require ("util");

var code = `
var x; // simple
while (x) {
doSomething(x);
}
`;


var a = esprima.parse(code, {comment: true, attachComments:true, range:true});
//console.log (util.inspect(a, {depth:null}));
//console.log (esgen .generate(a));


tr.traverse (a, {
enter: function (node, parent) {
var range, pre, post, s1,s2,s3;

if (node.type === "BlockStatement") {
// want to wrap the statements within the block in html tags
pre = `<div class="block ${parent.type}">\n`;
post = `</div>\n`;
range = node.range;
console.log ("range: ", range);
s1 = code.slice(0,range[0]-1);
s2 = code.slice(range[0], range[1]);
s3 = code.slice (range[1]+1, code.length-1);
code = s1 + pre + s2 + post + s3;
//node.body.unshift (literal(pre));
//node.body.push (literal(post));
} // if

function literal(_html) {
return {type: "Literal", value: 42, raw: _html};
} // literal

function comment (_html) {
return {type: "Line", value: _html, raw: _html};
} // comment

} // enter
});

//console.log (util.inspect(a, null, 4));
//console.log (esgen.generate (a, {comment: true, parse: esprima.parse, verbatim: "raw"}));
console.log (code);

