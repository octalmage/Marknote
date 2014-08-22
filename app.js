var gui = require('nw.gui'); 
var win = gui.Window.get();

var mb = new gui.Menu({type:"menubar"});
mb.createMacBuiltin("Chimera");
win.menu = mb;

//Show Chrome debug console.
//win.showDevTools();



var marked = require('marked');
var highlight = require('highlight.js');
var editor;
var store;
var notes=new Array(), note="";
var current=0;
var defaultnote=["#Welcome to Marknote\n**Clean, easy, markdown notes.**\nDouble click to get started!"];


//Custom Renderer
var renderer = new marked.Renderer();

//Custom links, going to use for internal links!
/*renderer.link = function (href, title, text) 
{
	output="<a target=\"_blank\" style='color:pink;' href=\"" + href + "\">" + text + "</a>";

	return output;
}*/

/*
renderer.code = function (code, language)
{
	output="<div id=\"code\">" + highlight.highlightAuto(code).value + "</div>";
	return output;

}
*/

//Markdown Settings. Using Github styled markdown for automatic links, code blocks, and tables. 
marked.setOptions({
  renderer: renderer,
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: true,
  highlight: function (code)  //use highlight.js for syntax highlighting. 
  {
    return highlight.highlightAuto(code).value;
  }
});





$(document).on("click", "list-item", function()
{
	loadNote($(this).attr("id"));
});
$(document).on("click", "#newNote", function()
{
	newNote();
})


$(document).on("ready",function()
{
	store = new Lawnchair(
	{
		adapter: "dom"
	}, function ()
	{})

//store.save({key:'notes', notes:["test", "test"]});
store.exists("notes", function (s)
{
	console.log("s: " + s);
	if (s===false)
	{
		store.save({key:'notes', notes: defaultnote});
		notes=defaultnote;
	}
	else
	{
		
		store.get("notes", function (n)
		{
			notes=n.notes;
			
		});
		//notes=n.notes;
		console.log(notes)
		
	}
});
	updateList();
	note=notes[current];
	markdown=marked(note, { renderer: renderer });

	$("#display").html(markdown);

	$("#note").on("dblclick", function()
	{
		if ($("#edit").css("display")=="none")
		{
			//Unselect text from doubleclick. 
			window.getSelection().removeAllRanges()
			//$("#noteedit").val(note);
			editor.setValue(note);
			$("#display").css("display","none");
			$("#edit").css("display", "block");

			//Put cursor at end of textarea.  
			setTimeout(function()
			{
				//$("#noteedit").focus();
				//$("#noteedit")[0].selectionStart = $("#noteedit")[0].selectionEnd = $("#noteedit")[0].value.length
				editor.clearSelection();

			},1)

		}
		else
		{	
			//unselect text from doubleclick. 
			window.getSelection().removeAllRanges()
			//note=$("#edit").text();
			note=editor.getValue();
			markdown=marked(note);
			$("#display").html(markdown);
			$("#edit").css("display", "none");
			$("#display").css("display","block");
			notes[current]=note;
			//Move note to the top!
			notes.splice(0, 0, notes.splice(current, 1)[0]); 
			current=0;
			store.save({key:'notes', notes:notes});
			updateList()

		}
	})
});

function updateList()
{
	$("#list").html("");
	for (i in notes)
	{
		addNote(notes[i].split("\n")[0], i);
	}	
}
 

function addNote(note, id)
{
	template="<list-item id=\"{{id}}\">{{note}}</list-item>";
	item=template.replace("{{note}}", note.replace(/\W+/g, " ")).replace("{{id}}", id);
	$("#list").append(item);
}

function loadNote(id)
{
	current=id;
	markdown=marked(notes[id]);
	$("#display").html(markdown);
	note=notes[id];
}
function newNote()
{
	notes.push("# New note");
	updateList();
	loadNote(notes.length-1);
}