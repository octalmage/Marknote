var gui = require('nw.gui'); 
var win = gui.Window.get();
var clipboard = gui.Clipboard.get();
var currentuser;

//Needed for copy,cut,paste menu on Mac.
if (process.platform=="darwin")
{
	var mb = new gui.Menu({type:"menubar"});
	mb.createMacBuiltin("Marknote");
	win.menu = mb;
}

//Parse Variables.
Parse.initialize("VvmNgHcupWn43L9ThaNDiIldMSjOXiLvd7DR7wTq", "DTAv28KMYt5pYlY3Q1yDJ3Tvm2FOViL4io9deBBt");
var Parse_Notes = Parse.Object.extend("Notes");
var Private_Parse_Notes = new Parse_Notes();
var syncing;
var parsenoteid;

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
			if (getTitle(notes[i]).toLowerCase().indexOf(title.toLowerCase())!==-1)
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
	if (displayShowing())
	{
		loadNote($(this).attr("id"));
	}
});
$(document).on("click", "#newNote", function()
{
	newNote();
})

$(document).on("mousemove", function(e)
{
	if (e.pageX>(window.innerWidth-75) && e.pageY>(window.innerHeight-75))
	{
		$("#pageflip").css("width", "25px");
		$("#pageflip").css("height", "25px");
	}
	else
	{
		$("#pageflip").css("width", "0px");
		$("#pageflip").css("height", "0px");
	}

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

	Mousetrap.bind('up', function(e)
	{
		e.preventDefault();
		current--;
		if (current<0)
		{
			current=notes.length-1;
		}
		loadNote(current);
		$("#list").scrollTop($("#" + current).offset().top);
	});

	Mousetrap.bind('down', function(e)
	{
		e.preventDefault();
		current++;
		if (current>notes.length-1)
		{
			current=0;
		}
		loadNote(current);
		$("#list").scrollTop($("#" + current).offset().top);
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

	/*Mousetrap.bind('up up down down left right left right b a', function() 
	{
		console.log("KONAMI")
	});*/

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



	store.exists("settings", function (s)
	{
		if (s!==false)
		{
			store.get("settings", function (n)
			{
				$("#username").val(n.username);
				$("#password").val(n.password);
				syncing=n.syncing;
				if (syncing===true)
				{
					login(n.username, n.password);
					$("#syncing").prop("checked", true);
				}
			});
		}
	});

	updateList();
	preloadCache();

	loadNote(current);
	selectItem(current);

	window.addEventListener('polymer-ready', function(e) 
	{
		document.getElementById("0").selected="yes";
	});
	

	$("#display").html(markdown);


	$("paper-icon-button[icon='close']").on("click", function()
	{
		deleteNote(current);
	});
	$("paper-icon-button[icon='content-copy']").on("click", function()
	{
		duplicateNote(current);
	});
	$("paper-icon-button[icon='menu']").on("click", function()
	{
		$.blockUI({ overlayCSS:  { cursor: null }, css: { border: "none", cursor: null} , message: $('#settings') }); 
	});
	$("#saveButton").on("click", function()
	{
		$.unblockUI();
		username=$("#username").val();
		password=$("#password").val();
		syncing=$("#syncing").prop("checked");
		store.save({key:'settings', username: username, password: password, syncing: syncing});
		if (syncing===true)
		{
			login(username,password);
		}
	})

	/*$("#note").on("tripleclick",{ threshold: 600 }, function(e)
	{

		if (displayShowing())
		{
			edit();
		}
		else
		{	
			display();
		}
	})*/

	$("#pageflip").on("mousedown", function()
	{
		if (displayShowing())
		{
			edit();
		}
		else
		{	
			display();
		}
	});
});

//Very cusom Renderer.
function render(markdown)
{
	html=marked(markdown, { renderer: renderer });
	return html;
}

function login(username, password)
{
 	Parse.User.logIn(username, password, 
 	{
  		success: function(user) 
  		{
  			//console.log(Parse.User.current())
  			currentuser = Parse.User.current();
  			if (syncing)
  			{
  				parse_getnotes()
  			}
  			
  		},
  		error: function(user, error) 
  		{
   			console.log(error)
   			signup(username, password);
  		}
	});
}

function signup(username, password)
{
	var user = new Parse.User();
	user.set("username", username);
	user.set("password", password);

 
	user.signUp(null, 
	{
  		success: function(user) 
  		{
  			login(username, password);
  		},
  		error: function(user, error) 
  		{
    		if (error.code==202)
    		{
    			$("#syncing").prop("checked", false);
    			alert("Username taken or password is incorrect.");
    		}
  		}
	});
}

function parse_getnotes()
{
	var query = new Parse.Query(Parse_Notes);
	query.find(
	{
  		success: function(results) 
  		{
  			if (results.length<1)
  			{
				Private_Parse_Notes.set("content", notes);
				Private_Parse_Notes.setACL(new Parse.ACL(Parse.User.current()));
				Private_Parse_Notes.save(null, 
				{
 					success: function(parsenote) 
 					{
 						parsenoteid=parsenote.id;
 					}
 				});
  			}
  			else
  			{
  				parsenoteid=results[0].id;
  				if (notes!=results[0].get("content"))
				{
					notes = results[0].get("content");
					updateList();
				}
  			}
  		},
  		error: function(error) 
  		{
   			alert("Error: " + error.code + " " + error.message);
  		}
  	});

}

function parse_savenotes()
{
	var query = new Parse.Query(Parse_Notes);
	query.get(parsenoteid, 
	{
  		success: function(n) 
  		{
  			n.set("content", notes)
  			n.save();
  		}
  	});
}

function edit()
{
	//Unselect text from doubleclick. 
	window.getSelection().removeAllRanges()
	editor.setValue(note);
	switchDisplay("edit");
	//Put cursor at end of textarea.  
	setTimeout(function()
	{
		editor.clearSelection();
		editor.focus();
	},1)
}

function display()
{
	//unselect text from doubleclick. 
	window.getSelection().removeAllRanges()
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
	if (syncing)
	{
		parse_savenotes();
	}
	return store.save({key:'notes', notes:notes});
}

function updateList()
{
	$("#list").html("");
	for (i in notes)
	{
		addNote(notes[i].split("\n")[0], i);
	}
	//Needed to account for dom update delay. 
	setTimeout(function()
	{
		selectItem(current);
	},1);
	
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

function selectItem(id)
{
	$( "list-item" ).each(function( index ) 
	{
		$("#" + index)[0].selected="no";
	});
	$("#" + id)[0].selected="yes";
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
	selectItem(id);
}
function newNote()
{
	notes.push(newnotetemplate);
	updateList();
	if (displayShowing())
	{
		loadNote(notes.length-1);		
	}
}

function getTitle(note)
{
	return note.split("\n")[0].replace(/\W+/g, " ");
}

RegExp.escape= function(s) 
{
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};