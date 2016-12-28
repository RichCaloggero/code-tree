"use strict";

var esprima = require ("esprima");
var esgen = require ("escodegen");
var tr = require ("estraverse");
var util = require ("util");

var code = `
var x;
while (x) {
doSomething(x);
}
`;

var text = "";

var a = esprima.parse(code);
//console.log (util.inspect(a, {depth:null}));
//console.log (esgen .generate(a));


tr.traverse (a, {
enter: function (node, parent) {
var pre, post, result;
result = esgen.generate (node);
/*if (node.type === "BlockStatement") {
// want to wrap the statements within the block in html tags
pre = `<div class="block ${parent.type}">\n`;
post = `</div>\n`;
result = pre + result + post;
} // if
*/
output (result);

function literal(_html) {
return {type: "Literal", value: 42, raw: _html};
} // literal

} // enter
});

function output (_text) {
text += _text;
} // output

//console.log (util.inspect(a, null, 4));
//console.log (esgen.generate (a, {verbatim: "raw"}));
console.log (text);

