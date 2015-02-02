var gui = require('nw.gui');
var win = gui.Window.get();
var clipboard = gui.Clipboard.get();
var currentuser;

//Needed for copy,cut,paste menu on Mac.
if (process.platform === "darwin")
{
	var mb = new gui.Menu(
	{
		type: "menubar"
	});
	mb.createMacBuiltin("Marknote");
	win.menu = mb;
}

//Parse Variables.
Parse.initialize("VvmNgHcupWn43L9ThaNDiIldMSjOXiLvd7DR7wTq", "DTAv28KMYt5pYlY3Q1yDJ3Tvm2FOViL4io9deBBt");
var Parse_Notes = Parse.Object.extend("Notes");
var Private_Parse_Notes = new Parse_Notes();
var syncing;
var wrap = true;
var parsenoteid;

var marked = require('marked');
var highlight = require('highlight.js');
var editor;
var store;
var notes = [],
	note = "";
var current = 0;
var defaultnote = ["#Welcome to Marknote\n**Clean, easy, markdown notes.**\nDouble click to get started!"];
var newnotetemplate = "# New note";
var noteCache = [];

//API Variables. 
var events = require('events');
var api = new events.EventEmitter();
var fs = require('fs');
//This is needed so plugins can't crash the app.  
process.on("uncaughtException", function(e) { console.log(e) });

var validImageExtensions = new Array("png", "gif", "bmp", "jpeg", "jpg");

//Custom Renderer
var renderer = new marked.Renderer();
//[todo] - Add better support for linking to headers.
renderer.link = function(href, title, text)
{
	var output;
	if (href.indexOf("://") !== -1)
	{
		output = "<a target=\"_blank\" href=\"" + href + "\">" + text + "</a>";
	}
	else if (href.indexOf("#") !== -1) //Allow linking to a header using #. 
	{
		output = "<a href=\"" + href + "\">" + text + "</a>";
	}
	else
	{
		output = "<a target=\"_blank\" href=\"note://" + href + "\">" + text + "</a>";
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
	var title;
	policy.ignore();
	if (url.indexOf("note://") !== -1)
	{
		title = url.replace("note://", "");
		for (var i in notes)
		{
			if (getTitle(notes[i]).toLowerCase().indexOf(title.toLowerCase()) !== -1)
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
marked.setOptions(
{
	renderer: renderer,
	gfm: true,
	tables: true,
	breaks: true,
	pedantic: false,
	sanitize: false,
	smartLists: true,
	smartypants: true,
	highlight: function(code, lang) //use highlight.js for syntax highlighting. 
	{
		if (!lang) return highlight.highlightAuto(code).value;

		try
		{
			content = highlight.highlight(lang, code).value;
		}
		catch (err)
		{
			content = highlight.highlightAuto(code).value;
		}
		return content;
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
});

$(document).on("mousemove", function(e)
{
	if (e.pageX > (window.innerWidth - 75) && e.pageY > (window.innerHeight - 75))
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
	if (e.pageX > (window.innerWidth - 200) && e.pageY < 50)
	{
		$("#actions").show();
	}
	else
	{
		$("#actions").hide();
	}
});

$(document).on("ready", function()
{
	window.ondragover = function(e)
	{
		e.preventDefault();
		return false;
	};
	window.ondrop = function(e)
	{
		e.preventDefault();
		return false;
	};

	var holder = document.getElementById('edit');

	holder.ondrop = function(e)
	{
		var ext, img;
		e.preventDefault();
		for (var i = 0; i < e.dataTransfer.files.length; ++i)
		{
			ext = e.dataTransfer.files[i].path.split(".");
			ext = ext[ext.length - 1];
			if (validImageExtensions.indexOf(ext) != -1)
			{
				img = "![](file://" + e.dataTransfer.files[i].path + ")";
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
		if ($("#find").css("display") === "none")
		{
			$("#find").css("display", "block");
			$("#findtext").focus();
		}
	});

	Mousetrap.bind('enter', function()
	{
		if ($("#find").css("display") !== "none")
		{
			search();
		}
	});

	Mousetrap.bind('up', function(e)
	{
		current--;
		if (current < 0)
		{
			current = notes.length - 1;
		}
		loadNote(current);

		$("#list").scrollTop((current - 1) * 29);
	});

	Mousetrap.bind('down', function(e)
	{
		current++;
		if (current > notes.length - 1)
		{
			current = 0;
		}
		loadNote(current);

		$("#list").scrollTop((current - 1) * 29);
	});

	Mousetrap.bind('esc', function()
	{
		$("#find").css("display", "none");
		$("#findtext").val("");
	});

	Mousetrap.stopCallback = function(e, element, combo)
	{
		return false;
	};

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
	}, function() {});

	store.exists("notes", function(s)
	{
		if (s === false)
		{
			store.save(
			{
				key: 'notes',
				notes: defaultnote
			});
			notes = defaultnote;
		}
		else
		{

			store.get("notes", function(n)
			{
				notes = n.notes;

			});
		}
	});

	store.exists("settings", function(s)
	{
		if (s !== false)
		{
			store.get("settings", function(n)
			{
				$("#username").val(n.username);
				$("#password").val(n.password);
				syncing = n.syncing;
				wrap = n.wrap;
				if (syncing === true)
				{
					login(n.username, n.password);
					$("#syncing").prop("checked", true);
				}
				if (wrap === true)
				{
					editor.getSession().setUseWrapMode(true);
					$("#wrap").prop("checked", true);
				}
				else
				{
					editor.getSession().setUseWrapMode(false);
					$("#wrap").prop("checked", false);
				}
			});
		}
	});

	updateList();
	preloadCache();
	loadNote(current, false);

	window.addEventListener('polymer-ready', function(e)
	{
		document.getElementById("0").selected = "yes";
	});

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
		$.blockUI(
		{
			overlayCSS:
			{
				cursor: null
			},
			css:
			{
				border: "none",
				cursor: null
			},
			message: $('#settings')
		});
	});
	$("#saveButton").on("click", function()
	{
		$.unblockUI();
		username = $("#username").val();
		password = $("#password").val();
		syncing = $("#syncing").prop("checked");
		wrap = $("#wrap").prop("checked");
		store.save(
		{
			key: 'settings',
			username: username,
			password: password,
			wrap: wrap,
			syncing: syncing
		});
		if (syncing === true)
		{
			login(username, password);
		}
		if (wrap === true)
		{
			editor.getSession().setUseWrapMode(true);
		}
		else
		{
			editor.getSession().setUseWrapMode(false);
		}
	});

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

	//Load plugins.
	if (fs.existsSync('./plugins/'))
	{
		fs.readdir('./plugins/', function(err,files)
		{
    		if(err) console.log(err);
    		files.forEach(function(file)
    		{
    			if (file.indexOf(".js") == file.length-3)
    			{
					var s = document.createElement("script");
					s.type = "text/javascript";
					s.src = "plugins/" + file;
					$("head").append(s);
					console.log("Loaded plugin: " + file);
    			}
    		});

    		//Let plugins know everything has finished loading. 
    		api.emit("apiready");
 		});
 	}
});

/**
 * Custom render function to setup marked options.
 * @param  {string} markdown The markdown syntax to be rendered.
 * @return {string}          Returns markdown rendered as HTML.
 */
function render(markdown)
{
	html = marked(markdown,
	{
		renderer: renderer
	});
	return html;
}

/**
 * Tries to login to Parse.com
 * @param  {string} username Parse.com username.
 * @param  {string} password Parse.com password.
 */
function login(username, password)
{
	Parse.User.logIn(username, password,
	{
		success: function(user)
		{
			currentuser = Parse.User.current();
			if (syncing)
			{
				parse_getnotes();
			}

		},
		error: function(user, error)
		{
			signup(username, password);
		}
	});
}

/**
 * Parse.com signup.
 * @param  {string} username Desired username.
 * @param  {string} password Desired password.
 */
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
			if (error.code === 202)
			{
				$("#syncing").prop("checked", false);
				alert("Username taken or password is incorrect.");
			}
		}
	});
}

/**
 * Syncs notes from Parse.com to local notes array.
 */
function parse_getnotes()
{
	var query = new Parse.Query(Parse_Notes);
	query.find(
	{
		success: function(results)
		{
			if (results.length < 1)
			{
				Private_Parse_Notes.set("content", notes);
				Private_Parse_Notes.setACL(new Parse.ACL(Parse.User.current()));
				Private_Parse_Notes.save(null,
				{
					success: function(parsenote)
					{
						parsenoteid = parsenote.id;
					}
				});
			}
			else
			{
				parsenoteid = results[0].id;
				if (_.isEqual(notes, results[0].get("content")) === false) //Cloud copy does not match local copy.
				{
					notes = results[0].get("content"); //Copy the cloud copy into memory. 
					preloadCache(); //Update the cache. 
					updateList(); //Update the list. 
					loadNote(current); //Update the note you're currently viewing. 
				}
			}
		},
		error: function(error)
		{
			alert("Error: " + error.code + " " + error.message);
		}
	});
}

/**
 * Save local notes array to Parse.com
 */
function parse_savenotes()
{
	var query = new Parse.Query(Parse_Notes);
	query.get(parsenoteid,
	{
		success: function(n)
		{
			n.set("content", notes);
			n.save();
		}
	});
}

/**
 * Opens the editor, updating the content and deselecting text.
 */
function edit()
{
	//Unselect text from doubleclick. 
	window.getSelection().removeAllRanges();
	editor.setValue(note);
	switchDisplay("edit");
	//Put cursor at end of textarea.  
	setTimeout(function()
	{
		editor.clearSelection();
		editor.focus();
	}, 1);

	api.emit("editing", {note: current});
}

/**
 * Displays the markdown, getting the content from the editor and updating/saving the notes.
 */
function display()
{
	//unselect text from doubleclick. 
	window.getSelection().removeAllRanges();
	note = editor.getValue();
	notes[current] = note;
	buildCache(current);
	$("#display").html(noteCache[current]);
	switchDisplay("display");
	//Move note (and cache) to the top!
	notes.splice(0, 0, notes.splice(current, 1)[0]);
	noteCache.splice(0, 0, noteCache.splice(current, 1)[0]);
	current = 0;
	saveNotes();
	updateList();

	api.emit("displaying", {note: current});
}

/**
 * Uses CSS to display/hide the editor and rendered markdown.
 * @param  {string} mode "edit" or "display".
 */
function switchDisplay(mode)
{
	if (mode === "edit")
	{
		$("#display").css("display", "none");
		$("#edit").css("display", "block");
	}
	else if (mode === "display")
	{
		$("#edit").css("display", "none");
		$("#display").css("display", "block");
	}
}

/**
 * Saves the notes to localStoreage using lawnchair.
 */
function saveNotes()
{
	if (syncing)
	{
		parse_savenotes();
	}
	store.save(
	{
		key: 'notes',
		notes: notes
	});
}

/**
 * Updates the list of notes then highlights the current note.
 */
function updateList()
{
	$("#list").html("");
	for (var i in notes)
	{
		addNote(notes[i].split("\n")[0], i);
	}
	//Needed to account for dom update delay. 
	setTimeout(function()
	{
		selectItem(current);
	}, 1);

}

/**
 * Duplicates note, saves, then updates note list.
 * @param  {int} id Note ID.
 * [todo] - Instead of recreating the list, just append the new list-item.
 */
function duplicateNote(id)
{
	notes.push(notes[current]);
	noteCache.push(noteCache[current]);
	saveNotes();
	updateList();
}

/**
 * Deletes note, saves, updates list then loads a new note.
 * @param  {int} id Note ID.
 */
function deleteNote(id)
{
	notes.splice(current, 1);
	noteCache.splice(current, 1);

	if (current > (notes.length - 1))
	{
		current -= 1;
	}
	saveNotes();
	updateList();
	loadNote(current);
}

/**
 * Detect if rendered markdown is currently displaying.
 * @return {boolean} true if HTML is displaying, false if editor.
 */
function displayShowing()
{
	return $("#edit").css("display") === "none";
}

/**
 * Adds list-item to the notes list.
 * @param {string} note Note's markdown, the top line is used to create the title.
 * @param {int} id   Note ID.
 */
function addNote(note, id)
{
	template = "<list-item id=\"{{id}}\">{{note}}</list-item>";
	item = template.replace("{{note}}", getTitle(note)).replace("{{id}}", id);
	$("#list").append(item);
}

/**
 * Preloads the noteCache array.
 */
function preloadCache()
{
	for (var i in notes)
	{
		buildCache(i);
	}
}

/**
 * Renders a note and stores the HTML in the noteCache array.
 * @param  {int} id Note ID.
 */
function buildCache(id)
{
	markdown = render(notes[id]);
	noteCache[id] = markdown;
}

/**
 * Highlights a note in the list.
 * @param  {int} id Note ID.
 */
function selectItem(id)
{
	$("list-item").each(function(index)
	{
		if ($("#" + index)[0].selected === "yes" && $("#" + index).attr("id") !== id)
		{
			$("#" + index)[0].selected = "no";
		}
	});
	if ($("#" + id)[0].selected === "no")
	{
		$("#" + id)[0].selected = "yes";
	}
}

/**
 * Displays a note from cache and selects it in the list.
 * @param  {int} id Note ID.
 * @param  {boolean} select If true, highlights the loaded note in the list.
 */
function loadNote(id, select)
{
	select = typeof select !== "undefined" ? select : true;
	var oldnote=id;
	current = id;
	if (!noteCache[id])
	{
		buildCache(id);
	}
	markdown = noteCache[id];
	$("#display").html(markdown);
	note = notes[id];
	if (select)
	{
		selectItem(id);
	}

	api.emit("noteloaded", {note: current, previousnote: oldnote});
}

/**
 * Adds a new note to the end of the list, then displays it.
 */
function newNote()
{
	notes.push(newnotetemplate);
	updateList();
	if (displayShowing())
	{
		loadNote(notes.length - 1);
	}
}

/**
 * API function to create a new note in the background. 
 * @param  {string} content Markdown to set as the notes content. 
 */
function createNote(content)
{
	notes.push(content);
	updateList();
	return notes.length;
}

/**
 * Generates the title by stripping non-alphabetical characters.
 * @param  {string} note Markdown to turn into a title.
 */
function getTitle(note)
{
	return note.split("\n")[0].replace(/\W+/g, " ");
}

/**
 * API function to get the title of a note.
 * @param  {int} id Note ID. 
 * @return {string}    The title of a note. 
 */		
function getNoteTitle(id)
{
	return getTitle(notes[id]);
}

function search()
{
	var val;
	$("#findtext").blur();
	val = $("#findtext").val();
	$("#findtext").val("");
	window.find(val, 0, 0, 1, 0, 0, 0);
	$("#findtext").val(val);
	//$("#findtext").focus();
}

/**
 * Escapes regex characters
 * @param  {string} s String to escape.
 * @return {string}   Escaped string.
 */
RegExp.escape = function(s)
{
	return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
