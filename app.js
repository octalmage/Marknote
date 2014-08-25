var gui = require('nw.gui'); 
var win = gui.Window.get();

var mb = new gui.Menu({type:"menubar"});
mb.createMacBuiltin("Marknote");
win.menu = mb;

var marked = require('marked');
var highlight = require('highlight.js');
var editor;
var store;
var notes=new Array(), note="";
var current=0;
var defaultnote=["#Welcome to Marknote\n**Clean, easy, markdown notes.**\nDouble click to get started!"];
var newnotetemplate="# New note";


//Custom Renderer
var renderer = new marked.Renderer();

//Very cusom Renderer.
function render(markdown)
{
	html=marked(markdown, { renderer: renderer });
	return html;
}

renderer.link = function (href, title, text) 
{
	if (href.indexOf("://")!=-1)
	{
		output="<a target=\"_blank\" href=\"" + href + "\">" + text + "</a>";
	}
	else
	{
		output="<a target=\"_blank\" href=\"note://" + href + "\">" + text + "</a>";
	}
	
	return output;
};

renderer.listitem = function(text) 
{
	if (/^\s*\[[x ]\]\s*/.test(text)) 
	{
		text = text
  			.replace(/^\s*\[ \]\s*/, '<input type="checkbox" class="task-list-item-checkbox" disabled> ')
  			.replace(/^\s*\[x\]\s*/, '<input type="checkbox" class="task-list-item-checkbox" checked disabled> ');
    	return '<li style="list-style: none; display: list-item;">' + text + '</li>';
  	} 
  	else 
  	{
    	return '<li>' + text + '</li>';
  	}
};

win.on('new-win-policy', function(frame, url, policy) 
{
	policy.ignore();
	if (url.indexOf("note://")!==-1)
	{
		title=url.replace("note://", "");
		for (i in notes)
		{
			if (getTitle(notes[i]).indexOf(title)!==-1)
			{
				loadNote(i);
				return;
			}
		}
	}
	else
	{
		gui.Shell.openExternal(url);
	}
});

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

$(document).on("mousemove", function(e)
{
	if (!displayShowing())
	{
		return;
	}
	if (e.pageX>(window.innerWidth-200) && e.pageY < 50)
	{
		$("#actions").show();
	}
	else
	{
		$("#actions").hide();
	}
});


$(document).on("ready",function()
{
	//Temporary access to devtools using CMD+ALT+I. 
	$(document).on("keypress", function(e) 
	{
  		if (e.altKey && e.metaKey && e.keyCode==94)
  		{
  			win.showDevTools();
  		}
 	 	
	});


	store = new Lawnchair(
	{
		adapter: "dom"
	}, function ()
	{})

	store.exists("notes", function (s)
	{
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
		}
	});



	updateList();
	note=notes[current];
	
	markdown=render(note);
	$("#display").html(markdown);


	$("paper-icon-button[icon='close']").on("click", function()
	{
		deleteNote(current);
	});
	$("paper-icon-button[icon='content-copy']").on("click", function()
	{
		duplicateNote(current);
	});

	$("#note").on("dblclick", function()
	{
		if (displayShowing())
		{
			//Unselect text from doubleclick. 
			window.getSelection().removeAllRanges()
			editor.setValue(note);
			switchDisplay("edit");
			//Put cursor at end of textarea.  
			setTimeout(function()
			{
				editor.clearSelection();
			},1)

		}
		else
		{	
			//unselect text from doubleclick. 
			window.getSelection().removeAllRanges()
			//note=$("#edit").text();
			note=editor.getValue();
			markdown=render(note);
			$("#display").html(markdown);
			switchDisplay("display");
			notes[current]=note;
			//Move note to the top!
			notes.splice(0, 0, notes.splice(current, 1)[0]); 
			current=0;
			saveNotes();
			updateList()

		}
	})
});

function switchDisplay(mode)
{
	if (mode=="edit")
	{
		$("#display").css("display","none");
		$("#edit").css("display", "block");
	}
	else if (mode=="display")
	{
		$("#edit").css("display", "none");
		$("#display").css("display","block");
	}
}

function saveNotes()
{
	return store.save({key:'notes', notes:notes});
}

function updateList()
{
	$("#list").html("");
	for (i in notes)
	{
		addNote(notes[i].split("\n")[0], i);
	}	
}

function duplicateNote(id)
{
	notes.push(notes[current]);
	saveNotes();
	updateList();
}

function deleteNote(id)
{
	notes.splice(current, 1); 

	if (current>(notes.length-1))
	{
		current-=1;
	}
	saveNotes();
	updateList();
	loadNote(current);
}
 
function displayShowing()
{
	return $("#edit").css("display")=="none";
}

function addNote(note, id)
{
	template="<list-item id=\"{{id}}\">{{note}}</list-item>";
	item=template.replace("{{note}}", getTitle(note)).replace("{{id}}", id);
	$("#list").append(item);
}

function loadNote(id)
{
	current=id;
	markdown=render(notes[id]);
	$("#display").html(markdown);
	note=notes[id];
	$("#" + id).css("background-color", "#fff");
}
function newNote()
{
	notes.push(newnotetemplate);
	updateList();
	loadNote(notes.length-1);
}

function getTitle(note)
{
	return note.split("\n")[0].replace(/\W+/g, " ");
}