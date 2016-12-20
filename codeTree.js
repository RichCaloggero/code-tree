"use strict";
$(document).ready (function () {
var $foldMarker = $('<span class="fold-marker">...</span>');
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
return false;

}).on ("click", ".cut", function (e) {
cut ();
return false;

}).on ("click", ".paste", function (e) {
paste ($savedNode, currentNode());
return false;

}).on ("click", ".save", function (e) {
save ();
return false;

}); // click .controls

$("#codeTree").on ("click", ".statement", function (e) {
e.stopPropagation ();
e.stopImmediatePropagation ();
e.preventDefault ();
return false;

}).on ("keypress",  function (e) {
/*var key = e.key || e.which || e.keyCode;
//debug ("key: ", typeof(key), " ", e.ctrlKey, " ", key, ", e.target ", e.target.className, ", this ", this.className);

if (e.ctrlKey) {
switch (key) {
case "": copy ();
return false;

case "s": save ();
return false;

case "x": $savedNode = cut ( currentNode() );
return false;

case "v": paste ( $savedNode, currentNode() );
return false;
} // switch

} else {
// no modifier
switch (key) {
case "Enter": case " ": $(e.target).trigger ("click");
return false;
} // switch
} // if
*/

return true;
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


$(".editor .content").val (parse(esprima.tokenize(code), generate().text));
status ("save complete");
} // save

function currentNode () {
return $("#codeTree").find ("#treeWalker-activeDescendant");
} // currentNode

function displayTree ($codeTree) {
var parseTree, html;
var text = $(".editor .content").val ();
html = parse (esprima.tokenize(text), generate().html);

/*parseTree = esprima.parse (text, {
	//loc: true,
});
$("#debug").html("");
debug (
JSON.stringify(parseTree)
.replace (/\:\[/g, ": [\n")
.replace (/\:\{/g, ": {\n")
.replace (/\],/g, "],\n")
.replace (/\},/g, "},\n")
); // debug

html = toHtml(parseTree);
*/

$codeTree.html (html);
foldAll ($codeTree);


treeWalker ({
$container: $codeTree.find (".block").first(),
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

function unfold ($statement) {
var $marker = $(".fold-marker", $statement).first();
//debug ("unfolding: ", $statement.length, $marker.length, $marker.parent().text());
$marker.remove ();
$statement.find (".block:first").show ();
} // unfold

function fold ($statement) {
$statement.find(".block:first").hide ();
$statement.find (".content").first().append ($foldMarker.clone());
} // fold

function toggleFold ($block) {
var $content = $(".content", $block).first();
var $marker = $content.next(".fold-marker");

//debug (`${$marker.length} ${$content.length}`);

$marker.toggleClass ("hidden");
$content.toggleClass ("hidden");
$block.parent().find(".fold-trigger").attr (
"aria-expanded", $content.hasClass("hidden")? "false" : "true"
);
//$(".editor .content").val ($folded.html());
return false;
} // toggleFold
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
$(e.target).trigger ("click");
}); // click .edit

function enableEditor ($editor) {
$(".content", $editor).removeAttr ("readonly")
.focus();
} // enableEditor

function disableEditor ($editor) {
$(".content", $editor).attr ("readonly", "true");
} // disableEditor

function status (message) {
$("#status").html ("");
$("#status").append (document.createTextNode (message));
} // status

}); // ready
