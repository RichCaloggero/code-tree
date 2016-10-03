$(document).ready (function () {
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

$("#codeTree").on ("click", ".item", function (e) {
//toggleFold ($(e.target));
e.stopPropagation ();
e.stopImmediatePropagation ();
e.preventDefault ();
return false;

}).on ("keypress",  function (e) {
var key = e.key || e.which || e.keyCode;
//debug ("key: ", typeof(key), " ", e.ctrlKey, " ", key, ", e.target ", e.target.className, ", this ", this.className);

if (e.ctrlKey) {
switch (key) {

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

return true;
}); // click

function cut ($from) {
status ("cut " + $from[0].className);
return $from;
} // cut

function paste ($from, $to) {
if ($from[0] === $to[0]) return;
if ($to.prev(".item")[0] === $from[0]) return;
$from = $from.remove ();
$to.before ($from);
status ("paste " + $from[0].className + " before " + $to[0].className);
} // paste

function save () {
var code = $("#codeTree").text();
code = code.replace (/\n\n/g, "\n");


$(".editor .content").val (code);
status ("save complete");
} // save

function currentNode () {
return $("#codeTree").find ("#treeTest-activeDescendant");
} // currentNode

function displayTree ($folded) {
var parseTree, html;
var text = $(".editor .content").val ();
parseTree = esprima.parse (text);
debug (
JSON.stringify(parseTree)
.replace (/\:\[/g, ": [\n")
.replace (/\:\{/g, ": {\n")
.replace (/\],/g, "],\n")
.replace (/\},/g, "},\n")
); // debug

html = toHtml(parseTree);

$folded.html (html);
$folded.find(".fold-marker").remove();
foldAll ($folded);


// toggle fold status

makeAccessible ({
$container: $folded.find (".block:first"),
name: "treeTest",

ul: ".block", 
li: ".item",

open : function ($node) {
//debug ("myOpen: " + $node[0].className);
unfold ($node.find(".block:first"));
}, // open

close : function ($node) {
//debug ("myClose: " + $node[0].className);
fold ($node.find (".block:first"));
}, // close

currentNode : function ($node) {
}, // open

leaveNode : function ($node) {
}, // close
}); // makeAccessible


function unfoldAll ($tree) {
$tree.find (".fold-trigger .block .content")
.addClass("hidden");
} // unfoldAll

function foldAll ($tree) {
$tree.find (".fold-trigger .block .content")
.addClass("hidden");
} // foldAll

function unfold ($block) {
//debug ("unfolding... ");
$block.find (".content").removeClass ("hidden");
} // unfold

function fold ($block) {
//debug ("folding... ");
$block.find (".content").addClass ("hidden");
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

}).on ("keydown", "button,a", function (e) {
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
