var gui = require('nw.gui'); 
var win = gui.Window.get();
var clipboard = gui.Clipboard.get();

//Needed for copy,cut,paste menu on Mac.
if (process.platform=="darwin")
{
	var mb = new gui.Menu({type:"menubar"});
	mb.createMacBuiltin("Marknote");
	win.menu = mb;
}

var marked = require('marked');
var highlight = require('highlight.js');
var editor;
var store;
var notes=new Array(), note="";
var current=0;
var defaultnote=["#Welcome to Marknote\n**Clean, easy, markdown notes.**\nDouble click to get started!"];
var newnotetemplate="# New note";
var noteCache=new Array();

var validImageExtensions=new Array("png", "gif", "bmp", "jpeg", "jpg");


//Custom Renderer
var renderer = new marked.Renderer();


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

	window.ondragover = function(e) { e.preventDefault(); return false };
	window.ondrop = function(e) { e.preventDefault(); return false };

	var holder = document.getElementById('edit');

	holder.ondrop = function (e) 
	{
		e.preventDefault();
 		for (var i = 0; i < e.dataTransfer.files.length; ++i) 
  		{
    		ext=e.dataTransfer.files[i].path.split(".");
    		ext=ext[ext.length-1];
    		if (validImageExtensions.indexOf(ext)!=-1)
    		{
    			img="![](file://" + e.dataTransfer.files[i].path + ")";
    			editor.insert(img);
    		}
  		}
  		return false;
	};

	Mousetrap.bind('mod+shift+c', function()
	{
		clipboard.set(notes[current], 'text');
	});

	Mousetrap.bind('mod+f', function()
	{
		console.log($("#find").css("display"));
		if ($("#find").css("display")=="none")
		{
			$("#find").css("display", "block");
			$("#findtext").focus();
		}
		else
		{
			$("#findtext").blur();
			val=$("#findtext").val();
			$("#findtext").val("");
			window.find(val, 0, 0, 1, 0, 0, 0);
			$("#findtext").val(val);
		}

	});

	Mousetrap.bind('esc', function()
	{
		$("#find").css("display", "none");
		$("#findtext").val("");
	});

	Mousetrap.stopCallback=function(e, element, combo) 
	{
    	return false
	}


	//Temporary access to devtools using CMD+ALT+I. 
	Mousetrap.bind('mod+alt+i', function()
	{
		win.showDevTools();
	});

	Mousetrap.bind('up up down down left right left right b a', function() 
	{
		console.log("KONAMI")
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
	preloadCache()
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
			notes[current]=note;
			buildCache(current);
			$("#display").html(noteCache[current]);
			switchDisplay("display");
			//Move note (and cache) to the top!
			notes.splice(0, 0, notes.splice(current, 1)[0]);
			noteCache.splice(0, 0, noteCache.splice(current, 1)[0]);
			current=0;
			saveNotes();
			updateList();

		}
	})
});

//Very cusom Renderer.
function render(markdown)
{
	html=marked(markdown, { renderer: renderer });
	return html;
}

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
	noteCache.push(noteCache[current]);
	saveNotes();
	updateList();
}

function deleteNote(id)
{
	notes.splice(current, 1); 
	noteCache.splice(current, 1);

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

function preloadCache()
{
	for (i in notes)
	{
		buildCache(i);
	}
}

function buildCache(id)
{
	markdown=render(notes[id]);
	noteCache[id]=markdown;
}

function loadNote(id)
{
	current=id;
	if (!noteCache[id])
	{
		buildCache(id);
	}
	markdown=noteCache[id];
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

RegExp.escape= function(s) 
{
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};