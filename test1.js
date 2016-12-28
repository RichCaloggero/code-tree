"use strict";

var estemplate = require ("estemplate");
var q = require ("esquery");
var esprima = require ("esprima");
var esgen = require ("escodegen");
var ESDispatcher = require ("esdispatch");
var d = new ESDispatcher();
var tr = require ("estraverse");
var util = require ("util");
var s = [], statements = [];

var code = `
var x;
while (x) {
doSomething(x);
}
`;

var template = '/*{*/ %{= body %} /*}*/';
var result;

var a = esprima.parse(code);
//console.log (util.inspect(a, {depth:null}));
//console.log (esgen .generate(a));


tr.traverse (a, {
replace: function (node, parent) {
var pre, post;
if (node.type === "BlockStatement") {
pre = `<div class="block ${parent.type}">`;
post = `</div>`;
node.body.unshift (comment(pre));
node.body.push (comment(post));
} // if
return node;

function comment(_html) {
return {type: "LineComment", value: _html};
} // literal

} // enter
});

//console.log (util.inspect(a, null, 4));
console.log (esgen.generate (a, {comment: true}));

/*d.on (
":statement",
function (node, ancestors) {
if (! node.body) return;
if (node.body.type !== "BlockStatement") return;

s.push (node);
});
d.observe (a);
console.log (s.length);

s.forEach (function (s) {
statements.push ({
keyword: s.type.substring(0, s.type.length-9),
node: s
}); // push

});

console.log(statements[0].keyword,
esgen.generate(
statements[0].node
)
);
*/
