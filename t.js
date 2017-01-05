"use strict";

var cst = require ("cst");
var code = `
while (true) {true;}
if (t1) true; else false;
`;
var a = new cst.Parser().parse(code);

var if1 = a.firstChild;
var if2 = if1.alternate;
var if3 = if2.alternate.body[0];

i(if1, if1.consequent.nextSibling);

function q(node, stop=1, level=stop) {
var result = "null";
if (node) {
result = `node: ${node.isToken? [node.type, node.value] : node.type}`; 
if (level>0) result += `
nextSibling: ${q(node.nextSibling, level-1)}
lastToken: ${q(node.getLastToken(), level-1)}
`;
} // if

if (level < stop) return result;
console.log (result);
} // q


function i (where, before) {
where.insertChildBefore (new cst.Token("CommentBlock","endif"), before);
console.log(where.getSourceCode());
} // i

module.exports = {q, i, if1, if2, if3, cst, code, a};
