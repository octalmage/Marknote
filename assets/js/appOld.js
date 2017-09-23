const gui = require('nw.gui');

const win = gui.Window.get();
const clipboard = gui.Clipboard.get();
let currentuser;

// Needed for copy,cut,paste menu on Mac.
if (process.platform === 'darwin') {
  const mb = new gui.Menu(
    {
      type: 'menubar',
    });
  mb.createMacBuiltin('Marknote');
  win.menu = mb;
}

// Firebase setup.
const config = {
  apiKey: 'AIzaSyDtYLpfW_yRF273-N6iwZDHDX7xG8Nt5_g',
  authDomain: 'marknote-681e3.firebaseapp.com',
  databaseURL: 'https://marknote-681e3.firebaseio.com',
  storageBucket: 'marknote-681e3.appspot.com',
  messagingSenderId: '809473583891',
};
firebase.initializeApp(config);

let syncing;
let wrap = true;
const marked = require('marked');
const highlight = require('highlight.js');

let editor;
let store;
let notes = [],
  note = '';
let current = 0;
const defaultnote = ['# Welcome to Marknote!\n**This is markdown.** Click the bottom right corner to get started.'];
const newnotetemplate = '# New note';
const noteCache = [];
const hooks = [];

// API Variables.
const events = require('events');

const api = new events.EventEmitter();
const fs = require('fs');

// This is needed so plugins can't crash the app.
process.on('uncaughtException', (e) => { console.log(e); });

const validImageExtensions = new Array('png', 'gif', 'bmp', 'jpeg', 'jpg');

// Custom Renderer
const renderer = new marked.Renderer();
// [todo] - Add better support for linking to headers.
renderer.link = function (href, title, text) {
  let output;
  if (href.indexOf('://') !== -1) {
    output = `<a target="_blank" href="${href}">${text}</a>`;
  } else if (href.indexOf('#') !== -1) // Allow linking to a header using #.
  {
    output = `<a href="${href}">${text}</a>`;
  } else {
    output = `<a target="_blank" href="note://${href}">${text}</a>`;
  }

  return output;
};

renderer.listitem = function (text) {
  if (/^\s*\[[x ]\]\s*/.test(text)) {
    text = text
      .replace(/^\s*\[ \]\s*/, '<input type="checkbox" class="task-list-item-checkbox"> ')
      .replace(/^\s*\[x\]\s*/, '<input type="checkbox" class="task-list-item-checkbox" checked> ');
    return `<li style="list-style: none; display: list-item;">${text}</li>`;
  }

  return `<li>${text}</li>`;
};

win.on('new-win-policy', (frame, url, policy) => {
  let title;
  policy.ignore();
  if (url.indexOf('note://') !== -1) {
    title = url.replace('note://', '');
    for (const i in notes) {
      if (getTitle(notes[i]).toLowerCase().indexOf(title.toLowerCase()) !== -1) {
        loadNote(i);
        return;
      }
    }
  } else {
    gui.Shell.openExternal(url);
  }
});

// Markdown Settings. Using Github styled markdown for automatic links, code blocks, and tables.
marked.setOptions(
  {
    renderer,
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    highlight(code, lang) // use highlight.js for syntax highlighting.
    {
      if (!lang) return highlight.highlightAuto(code).value;

      try {
        content = highlight.highlight(lang, code).value;
      } catch (err) {
        content = highlight.highlightAuto(code).value;
      }
      return content;
    },
  });

$(document).on('change', "input[type='checkbox']", function (e) {
  // Get the new checked status.
  const status = !!($(this).attr('checked'));
  // Create our new checkbox markdown.
  const newCheckbox = (status === true) ? '- [x] ' : '- [ ] ';

  // Get the index of the checkbox that was clicked.
  const index = $('.task-list-item-checkbox').index(this);

  // Start nth at -1, since it will be incremented before it's used, and we want to start a 0.
  let nth = -1;

  // Loop till we get to our checkbox at "index".
  notes[current] = notes[current].replace(/-\s*\[[x\s]\]\s/gi, (match) => {
    nth++;
    return (nth === index) ? newCheckbox : match;
  });

  // Rebuild the cache, reload the editor, and save it!
  buildCache(current);
  loadNote(current);
  saveNotes();
});

$(document).on('click', 'list-item', function () {
  if (displayShowing()) {
    loadNote($(this).attr('id'));
  }
});
$(document).on('click', '#newNote', () => {
  newNote();
});

$(document).on('mousemove', (e) => {
  if (e.pageX > (window.innerWidth - 75) && e.pageY > (window.innerHeight - 75)) {
    $('#pageflip').css('width', '25px');
    $('#pageflip').css('height', '25px');
  } else {
    $('#pageflip').css('width', '0px');
    $('#pageflip').css('height', '0px');
  }

  if (!displayShowing()) {
    return;
  }
  if (e.pageX > (window.innerWidth - 200) && e.pageY < 50) {
    $('#actions').show();
  } else {
    $('#actions').hide();
  }
});

$(document).on('ready', () => {
  window.ondragover = function (e) {
    e.preventDefault();
    return false;
  };
  window.ondrop = function (e) {
    e.preventDefault();
    return false;
  };

  const holder = document.getElementById('edit');

  holder.ondrop = function onDrop(e) {
    let ext;
    let img;
    e.preventDefault();
    for (let i = 0; i < e.dataTransfer.files.length; ++i) {
      ext = e.dataTransfer.files[i].path.split('.');
      ext = ext[ext.length - 1];
      if (validImageExtensions.indexOf(ext) != -1) {
        img = `![](file://${e.dataTransfer.files[i].path})`;
        editor.insert(img);
      }
    }
    return false;
  };

  Mousetrap.bind('mod+shift+c', () => {
    clipboard.set(notes[current], 'text');
  });

  Mousetrap.bind('mod+f', () => {
    if ($('#find').css('display') === 'none') {
      $('#find').css('display', 'block');
      $('#findtext').focus();
    }
  });

  Mousetrap.bind('enter', () => {
    if ($('#find').css('display') !== 'none') {
      search();
    }
  });

  Mousetrap.bind('esc', () => {
    $('#find').css('display', 'none');
    $('#findtext').val('');
  });

  Mousetrap.stopCallback = function (e, element, combo) {
    return false;
  };

  // Temporary access to devtools using CMD+ALT+I.
  Mousetrap.bind('mod+alt+i', () => {
    win.showDevTools();
  });

  Mousetrap.bind('up up down down left right left right b a', () => {
    if ($('#display').css('background-image') != 'none') {
      $('#display').css('background-image', 'none');
    } else {
      $('#display').css('background-image', "url('http://media1.giphy.com/media/AQvUFtbARPzsQ/giphy.gif')");
    }
  });

  store = new Lawnchair(
    {
      adapter: 'dom',
    }, (() => {}));

  store.exists('notes', (s) => {
    if (s === false) {
      store.save(
        {
          key: 'notes',
          notes: defaultnote,
        });
      notes = defaultnote;
    } else {
      store.get('notes', (n) => {
        notes = n.notes;
      });
    }
  });

  store.exists('settings', (s) => {
    if (s !== false) {
      store.get('settings', (n) => {
        $('#username').val(n.username);
        $('#password').val(n.password);
        syncing = n.syncing;
        wrap = n.wrap;
        if (syncing === true) {
          login(n.username, n.password);
          $('#syncing').prop('checked', true);
        }
        if (wrap === true) {
          editor.getSession().setUseWrapMode(true);
          $('#wrap').prop('checked', true);
        } else {
          editor.getSession().setUseWrapMode(false);
          $('#wrap').prop('checked', false);
        }
      });
    }
  });

  // Highlight the first note in the list.
  window.addEventListener('polymer-ready', (e) => {
    document.getElementById('0').selected = 'yes';
  });

  $("paper-icon-button[icon='close']").on('click', () => {
    deleteNote(current);
  });
  $("paper-icon-button[icon='content-copy']").on('click', () => {
    duplicateNote(current);
  });
  $("paper-icon-button[icon='menu']").on('click', () => {
    $.blockUI(
      {
        overlayCSS:
   {
     cursor: null,
   },
        css:
   {
     border: 'none',
     cursor: null,
   },
        message: $('#settings'),
      });
  });
  $('#saveButton').on('click', () => {
    $.unblockUI();
    username = $('#username').val();
    password = $('#password').val();
    syncing = $('#syncing').prop('checked');
    wrap = $('#wrap').prop('checked');
    store.save(
      {
        key: 'settings',
        username,
        password,
        wrap,
        syncing,
      });
    if (syncing === true) {
      login(username, password);
    }
    if (wrap === true) {
      editor.getSession().setUseWrapMode(true);
    } else {
      editor.getSession().setUseWrapMode(false);
    }
  });

  $('#pageflip').on('mousedown', () => {
    if (displayShowing()) {
      edit();
    } else {
      display();
    }
  });

  // Load plugins.
  if (fs.existsSync('./plugins/')) {
    fs.readdir('./plugins/', (err, files) => {
    		if (err) console.log(err);
    		files.forEach((file) => {
    			if (file.indexOf('.js') == file.length - 3) {
          const s = document.createElement('script');
          s.type = 'text/javascript';
          s.src = `plugins/${file}`;
          $('head').append(s);
          console.log(`Loaded plugin: ${file}`);
    			}
    		});

    		// Let plugins know everything has finished loading.
    		api.emit('apiready');
      updateList();
      preloadCache();
      loadNote(current, false);
 		});
 	} else {
    updateList();
    preloadCache();
    loadNote(current, false);
  }
});

/**
 * Custom render function to setup marked options.
 * @param  {string} markdown The markdown syntax to be rendered.
 * @return {string}          Returns markdown rendered as HTML.
 */
function render(markdown) {
  // Process "render" hook for plugins.
  markdown = processHook('render', markdown);

  html = marked(markdown,
    {
      renderer,
    });
  return html;
}

/**
 * Tries to login to Firebase
 * @param  {string} username Parse.com username.
 * @param  {string} password Parse.com password.
 */
function login(username, password) {
  firebase.auth().signInWithEmailAndPassword(username, password).then(() => {
    cloud_getnotes();
  }).catch((error) => {
    signup(username, password);
  });
}

/**
 * Firebase signup.
 * @param  {string} username Desired username.
 * @param  {string} password Desired password.
 */
function signup(username, password) {
  firebase.auth().createUserWithEmailAndPassword(username, password).catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;

    $('#syncing').prop('checked', false);
    alert('Username taken or password is incorrect.');
  });
}

/**
 * Syncs notes from Parse.com to local notes array.
 */
function cloud_getnotes() {
  const userId = firebase.auth().currentUser.uid;
  firebase.database().ref(`/notes/${userId}`).once('value').then((snapshot) => {
    if (snapshot.val()) {
      notes = snapshot.val();
      preloadCache(); // Update the cache.
      updateList(); // Update the list.
      loadNote(current); // Update the note you're currently viewing.
    } else {
      cloud_savenotes();
    }
  });
}

/**
 * Save local notes array to Parse.com
 */
function cloud_savenotes() {
  const userId = firebase.auth().currentUser.uid;
  firebase.database().ref(`notes/${userId}`).set(notes);
}

/**
 * Opens the editor, updating the content and deselecting text.
 */
function edit() {
  // Unselect text from doubleclick.
  window.getSelection().removeAllRanges();
  editor.setValue(note);
  switchDisplay('edit');
  // Put cursor at end of textarea.
  setTimeout(() => {
    editor.clearSelection();
    editor.focus();
  }, 1);

  api.emit('editing', { note: current });
}

/**
 * Displays the markdown, getting the content from the editor and updating/saving the notes.
 */
function display() {
  // unselect text from doubleclick.
  window.getSelection().removeAllRanges();
  note = editor.getValue();
  notes[current] = note;
  buildCache(current);
  $('#display').html(noteCache[current]);
  switchDisplay('display');
  // Move note (and cache) to the top!
  notes.splice(0, 0, notes.splice(current, 1)[0]);
  noteCache.splice(0, 0, noteCache.splice(current, 1)[0]);
  current = 0;
  saveNotes();
  updateList();

  api.emit('displaying', { note: current });
}

/**
 * Uses CSS to display/hide the editor and rendered markdown.
 * @param  {string} mode "edit" or "display".
 */
function switchDisplay(mode) {
  if (mode === 'edit') {
    $('#display').css('display', 'none');
    $('#edit').css('display', 'block');
  } else if (mode === 'display') {
    $('#edit').css('display', 'none');
    $('#display').css('display', 'block');
  }
}

/**
 * Saves the notes to localStoreage using lawnchair.
 */
function saveNotes() {
  if (syncing) {
    cloud_savenotes();
  }
  store.save(
    {
      key: 'notes',
      notes,
    });
}

/**
 * Updates the list of notes then highlights the current note.
 */
function updateList() {
  $('#list').html('');
  for (const i in notes) {
    addNote(notes[i].split('\n')[0], i);
  }
  // Needed to account for dom update delay.
  setTimeout(() => {
    selectItem(current);
  }, 1);
}

/**
 * Duplicates note, saves, then updates note list.
 * @param  {int} id Note ID.
 * [todo] - Instead of recreating the list, just append the new list-item.
 */
function duplicateNote(id) {
  notes.push(notes[current]);
  noteCache.push(noteCache[current]);
  saveNotes();
  updateList();
}

/**
 * Deletes note, saves, updates list then loads a new note.
 * @param  {int} id Note ID.
 */
function deleteNote(id) {
  notes.splice(current, 1);
  noteCache.splice(current, 1);

  if (current > (notes.length - 1)) {
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
function displayShowing() {
  return $('#edit').css('display') === 'none';
}

/**
 * Adds list-item to the notes list.
 * @param {string} note Note's markdown, the top line is used to create the title.
 * @param {int} id   Note ID.
 */
function addNote(note, id) {
  template = '<list-item id="{{id}}">{{note}}</list-item>';
  item = template.replace('{{note}}', getTitle(note)).replace('{{id}}', id);
  $('#list').append(item);
}

/**
 * Preloads the noteCache array.
 */
function preloadCache() {
  for (const i in notes) {
    buildCache(i);
  }
}

/**
 * Renders a note and stores the HTML in the noteCache array.
 * @param  {int} id Note ID.
 */
function buildCache(id) {
  markdown = render(notes[id]);
  noteCache[id] = markdown;
}

/**
 * Highlights a note in the list.
 * @param  {int} id Note ID.
 */
function selectItem(id) {
  $('list-item').each((index) => {
    if ($(`#${index}`)[0].selected === 'yes' && $(`#${index}`).attr('id') !== id) {
      $(`#${index}`)[0].selected = 'no';
    }
  });
  if ($(`#${id}`)[0].selected === 'no') {
    $(`#${id}`)[0].selected = 'yes';
  }
}

/**
 * Displays a note from cache and selects it in the list.
 * @param  {int} id Note ID.
 * @param  {boolean} select If true, highlights the loaded note in the list.
 */
function loadNote(id, select) {
  select = typeof select !== 'undefined' ? select : true;
  const oldnote = id;
  current = id;
  if (!noteCache[id]) {
    buildCache(id);
  }
  markdown = noteCache[id];
  $('#display').html(markdown);
  note = notes[id];
  if (select) {
    selectItem(id);
  }

  api.emit('noteloaded', { note: current, previousnote: oldnote });
}

/**
 * Adds a new note to the end of the list, then displays it.
 */
function newNote() {
  notes.push(newnotetemplate);
  updateList();
  if (displayShowing()) {
    loadNote(notes.length - 1);
  }
}

/**
 * API function to create a new note in the background.
 * @param  {string} content Markdown to set as the notes content.
 */
function createNote(content) {
  notes.push(content);
  updateList();
  return notes.length;
}

/**
 * Generates the title by stripping non-alphabetical characters.
 * @param  {string} note Markdown to turn into a title.
 */
function getTitle(note) {
  return note.split('\n')[0] // Grab the first line.
    .replace(/\(.*\)/g, '') // Remove links.
    .replace(/\W+/g, ' '); // Remove all non letters.
}

/**
 * API function to get the title of a note.
 * @param  {int} id Note ID.
 * @return {string}    The title of a note.
 */
function getNoteTitle(id) {
  return getTitle(notes[id]);
}

/**
 * Add a hook callback from a plugin.
 * @param {string} hook The hook name.
 * @param {string} callback The function to call when the hook is processed.
 */
function addHook(hook, callback) {
  if (typeof hooks[hook] === 'undefined') {
    hooks[hook] = [];
  }
  hooks[hook].push(callback);
}

/**
 * Process hook and run all listed functions.
 * @param {string} hook The hook name.
 * @param {string} content The content/string to process.
 * @return {string} The content after plugins have processed it.
 */
function processHook(hook, content) {
  for (const x in hooks[hook]) {
    content = hooks[hook][x](content);
  }

  return content;
}

function search() {
  let val;
  $('#findtext').blur();
  val = $('#findtext').val();
  $('#findtext').val('');
  window.find(val, 0, 0, 1, 0, 0, 0);
  $('#findtext').val(val);
  // $("#findtext").focus();
}

/**
 * Escapes regex characters
 * @param  {string} s String to escape.
 * @return {string}   Escaped string.
 */
RegExp.escape = function (s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
