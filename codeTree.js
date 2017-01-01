"use strict";
var wrap = require ("./wrap.js").wrap;
$(document).ready (function () {
var $foldMarker = $('<span class="foldMarker">...</span>');
var $savedNode = null;

jQuery.get ("t.txt", null, null, "text")
.fail (function (error) {
alert (error);

}).done (function (text) {
$(".editor .content").val (text);
displayTree ( $("#codeTree") );
}); // get

$(".editor").on ("change", ".content", function () {
displayTree ( $("#codeTree") );
}); // update on change


$("#controls")
.on ("click", ".copy", function (e) {
copy ();
program().focus();

}).on ("click", ".cut", function (e) {
cut ();
program().focus();
return false;

}).on ("click", ".paste", function (e) {
paste ($savedNode, currentNode());
program().focus();
return false;

}).on ("click", ".save", function (e) {
save ();
program().focus();
return false;

}); // click .controls

$("#codeTree")
.on ("click", ".statement", function (e) {
e.stopPropagation ();
e.stopImmediatePropagation ();
e.preventDefault ();
return false;

}); // click

function cut ($from) {
if (! $from) $from = currentNode();
status ("cut " + $from[0].className);
return $from.remove();
} // cut

function copy () {
status("copy...");
return ($savedNode = currentNode());
} // copy

function paste ($from, $to) {
if (! $from || ! $to || $from.length === 0 || $to.length === 0) {
status ("Paste not performed - null parameter given");
return;
} // if

if ($from[0] === $to[0]) return;
if ($to.prev(".statement")[0] === $from[0]) return;
$to.before ($from);
status ("paste " + $from[0].className + " before " + $to[0].className);
} // paste

function save () {
var code = $("#codeTree").text();
code = code.replace (/\n\n/g, "\n");
code=code.replace (/\n\{/g, " {\n");

$(".editor .content").val (code);
status ("save complete");
} // save

function currentNode () {
return $("#codeTree").find ("#treeWalker-activeDescendant");
} // currentNode

function displayTree ($codeTree) {
var parseTree, html;
var text = $(".editor .content").val ();
status("Loading...");
try {
html = wrap(text, {strictMode: false});
} catch (e) {
status(e.message + "\n" + e.stack);
return;
} // catch

$codeTree.html (html);
program().attr("accesskey", "p");
foldAll ($codeTree);
status ("Done.");


treeWalker ({
$container: program(),
name: "treeTest",
flow: true,

group: ".block", 
branch: ".statement",

open : function ($node) {
//debug ("myOpen: " + $node[0].className);
unfold ($node);
}, // open

close : function ($node) {
//debug ("myClose: " + $node[0].className);
fold ($node);
}, // close
}); // treeWalker


function unfoldAll ($tree) {
unfold ( $(".statement .fold-marker", $tree).parent().parent());
} // unfoldAll

function foldAll ($tree) {
fold ($tree.find (".statement .block").parent());
} // foldAll

function fold ($statement) {
var $foldMarker = $statement.find ($foldMarker);

$statement.find(".block:first").hide ();
if ($foldMarker && $foldMarker.length > 0) $foldMarker.show ();
else $statement.append ($foldMarker.clone());
} // fold

function unfold ($statement) {
var $marker = $(".fold-marker", $statement).first();
//debug ("unfolding: ", $statement.length, $marker.length, $marker.parent().text());
$marker.hide();
$statement.find (".block:first").show ();
} // unfold

} // displayTree


$(".editor > .edit").on ("click", function (e) {
var $edit = $(e.target);
var state = $edit.attr("aria-pressed") === "true";
var $editor = $edit.parent();
if (! $editor || $editor.length === 0) return;

if (state) {
// turn it off
disableEditor ($editor);
$(this).attr ("aria-pressed", "false");

} else {
// turn it on
enableEditor ($editor);
$(this).attr ("aria-pressed", "true");
} // if

}).on ("keypress", "button,a", function (e) {
if (e.keyCode == 13 || e.keyCode == 32) {
$(e.target).trigger ("click");
} // if
return true;
}); // click .edit

function enableEditor ($editor) {
$(".content", $editor).removeAttr ("readonly")
.focus();
} // enableEditor

function disableEditor ($editor) {
$(".content", $editor).attr ("readonly", "true");
} // disableEditor

function program () {
return $("#codeTree").find (".block").first();
} // program

function status (message) {
$("#status").html ("");
$("#status").append (document.createTextNode (message));
} // status

function treeToString (tree) {
return (
JSON.stringify(tree)
.replace (/\:\[/g, ": [\n")
.replace (/\:\{/g, ": {\n")
.replace (/\],/g, "],\n")
.replace (/\},/g, "},\n")
); // return
} // treeToString

}); // ready
