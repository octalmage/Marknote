var marked = require('marked');
var highlight = require('highlight.js');
var editor;
var store;
var notes=new Array();



//Custom Renderer
var renderer = new marked.Renderer();

//Custom links, going to use for internal links!
renderer.link = function (href, title, text) 
{
	output="<a target=\"_blank\" style='color:pink;' href=\"" + href + "\">" + text + "</a>";

	return output;
}

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
  	console.log(code);
  	console.log(highlight.highlightAuto(code).value);
    return highlight.highlightAuto(code).value;
  }
});










$(document).on("ready",function()
{
	store = new Lawnchair(
	{
		adapter: "dom"
	}, function ()
	{})

	///store.save({key:'notes', notes:["test", "test"]});

	store.get("notes", function (n)
	{
		if (n.notes)
		{
			notes=n.notes;
		}
		else
		{
			note="#I am using#\n**markdown**.";
		}
		//notes=n.notes;
		console.log(notes)
	});

	note="#I am using#\n**markdown**."
	var gui = require('nw.gui'); 
	var win = gui.Window.get();

	//Show Chrome debug console.
	win.showDevTools();

	note=notes[0];
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
			notes[0]=note;
			store.save({key:'notes', notes:notes});

		}
	})
});