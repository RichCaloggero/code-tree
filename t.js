"use strict";

var cst = require ("cst");
var code = `for (var i=0; i<x; i++) {
frog();
}`;
var a = new cst.Parser().parse(code);
var x;

x = a.firstChild;
console.log (x.type, x.isStatement, Object.keys(x));

function q(node) {
if (! node) return "null";
return (node.isToken)? [node.type, node.value] : node.type;
} // q


function i (where, before) {
where.insertChildBefore (new cst.Token("CommentBlock","endif"), before);
console.log(where.getSourceCode());
} // i

module.exports = {q, i,  cst, code, a};
