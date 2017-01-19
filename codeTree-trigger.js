"use strict";
var addTriggers = require ("./trigger.js").annotate;

$(document).ready (function () {
var foldMarker = '<span class="foldMarker">...</span>';
var $savedNode = null;

jQuery.get ("t.txt", null, null, "text")
.fail (function (error) {
alert (error);

}).done (function (text) {
$(".editor .content").val (text);
displayTree ( $("#codeTree") );
}); // get

$(".editor").on ("change", ".content", function () {
displayTree ( $("#codeTree"), $(".editor .raw").prop ("checked"));
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
.on ("click", ".trigger", function (e) {
e.stopPropagation ();
e.stopImmediatePropagation ();
e.preventDefault ();
toggleFold ($(e.target));
return false;

}); // click

function toggleFold ($trigger) {
if ($trigger.is ("[aria-expanded=true]")) fold ($trigger);
else unfold ($trigger);
} // toggleFold

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

function displayTree ($codeTree, raw) {
var parseTree, html;
var text = $(".editor .content").val ();
status("Loading...");
if (! raw) {
try {
html = addTriggers (text, {strictMode: false});
} catch (e) {
status(e.message + "\n" + e.stack);
return;
} // catch
} else {
html = text;
} // if

$codeTree.html (html);
program().attr("accesskey", "p");
foldAll ($codeTree);
status ("Done.");

} // displayTree

function unfoldAll ($tree) {
unfold ($tree.find (".trigger"));
} // unfoldAll

function foldAll ($tree) {
fold ($tree.find (".trigger"));
} // foldAll

function fold ($trigger) {
$trigger.attr ("aria-expanded", "false")
.next(".block").after($(foldMarker));
} // fold

function unfold ($trigger) {
$trigger.attr ("aria-expanded", "true")
.nextAll(".foldMarker").first().remove();
} // unfold

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
