const initialState = { notes: [], selected: 0 };
const newNoteTemplate = '# New note';
// Allow adjusting merge method.
const returnState = (state, changes) => changes;

const notesApp = (state = initialState, action) => {
  switch (action.type) {
    case 'UPDATE_CURRENT_NOTE':
      return returnState(state, { selected: action.index, searchTerm: '' });
    case 'NEW_NOTE': {
      const newNotes = state.notes.slice();
      newNotes.unshift(newNoteTemplate);
      return returnState(state, {
        notes: newNotes,
        selected: 0,
      });
    }
    case 'UPDATE_NOTE': {
      const newNotes = state.notes.slice();
      newNotes[state.selected] = action.note;
      newNotes.splice(0, 0, newNotes.splice(state.selected, 1)[0]);
      return returnState(state, { notes: newNotes, selected: 0 });
    }
    case 'DUPLICATE_CURRENT_NOTE': {
      const newNotes = state.notes.slice();
      newNotes.unshift(state.notes[state.selected]);
      return returnState(state, {
        notes: newNotes,
        selected: 0,
      });
    }
    case 'UPDATE_SEARCH_TERM': {
      return returnState(state, {
        searchTerm: action.searchTerm,
      });
    }
    case 'DELETE_CURRENT_NOTE': {
      const newNotes = state.notes.slice();
      newNotes.splice(state.selected, 1);
      let selected = state.selected;

      // If the selected note is longer than the length of notes, select the previous item
      if (selected > (newNotes.length - 1)) {
        selected -= 1;
      }

      // If there are no notes, add a new note.
      if (newNotes.length === 0) {
        newNotes.push(newNoteTemplate);
        selected = 0;
      }
      return returnState(state, { selected, notes: newNotes });
    }
    default:
      return state;
  }
};

export default notesApp;
