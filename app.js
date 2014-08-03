var marked = require('marked');
var highlight = require('highlight.js');



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

note="#I am using#\n**markdown**.";
markdown=marked(note, { renderer: renderer });

var store=new Lawnchair(function()
{

    this.get('notes', function(notes) 
    {
       console.log(notes)
    })

    this.save({key:'notes',notes:note})
})



$(document).on("ready",function()
{
	var gui = require('nw.gui'); 
	var win = gui.Window.get();

	//Show Chrome debug console.
	win.showDevTools();

	$("#display").html(markdown);

	$("#note").on("dblclick", function()
	{
		if ($("#edit").css("display")=="none")
		{
			//Unselect text from doubleclick. 
			window.getSelection().removeAllRanges()
			$("#noteedit").val(note);
			$("#display").css("display","none");
			$("#edit").css("display", "block");

			//Put cursor at end of textarea.  
			setTimeout(function()
			{
				$("#noteedit").focus();
				$("#noteedit")[0].selectionStart = $("#noteedit")[0].selectionEnd = $("#noteedit")[0].value.length
			},1)

		}
		else
		{	
			//unselect text from doubleclick. 
			window.getSelection().removeAllRanges()
			note=$("#noteedit").val();
			markdown=marked(note);
			$("#display").html(markdown);
			$("#edit").css("display", "none");
			$("#display").css("display","block");

		}
	})
});