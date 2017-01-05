"use strict";

var cst = require ("cst");
var code = `if (t1) {true;} else {false;}`;
var a = new cst.Parser().parse(code);

var if1 = a.firstChild;
var con = if1.consequent;
var alt = if1.alternate;


function q(node) {
if (! node) return "null";
return (node.isToken)? [node.type, node.value] : node.type;
} // q


function i (where, before) {
where.insertChildBefore (new cst.Token("CommentBlock","endif"), before);
console.log(where.getSourceCode());
} // i

module.exports = {q, i, if1, con, alt, cst, code, a};
