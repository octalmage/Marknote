const initialState = { notes: [], selected: 0 };

const notesApp = (state = initialState, action) => {
  switch (action.type) {
    case 'UPDATE_CURRENT_NOTE':
      return Object.assign(state, { selected: action.index });
    case 'NEW_NOTE': {
      const newNotes = state.notes.slice();
      newNotes.unshift('# New note');
      return Object.assign(state, {
        notes: newNotes,
        selected: 0,
      });
    }
    case 'UPDATE_NOTE': {
      const newNotes = state.notes.slice();
      newNotes[state.selected] = action.note;
      newNotes.splice(0, 0, newNotes.splice(state.selected, 1)[0]);
      return Object.assign(state, { notes: newNotes, selected: 0 });
    }
    case 'DELETE_CURRENT_NOTE': {
      console.log('delete');
      const newNotes = state.notes.slice();
      newNotes.splice(state.selected, 1);
      let selected = state.selected;
      if (selected > (state.notes.length - 1)) {
        selected -= 1;
      }
      return Object.assign(state, { selected, notes: newNotes });
    }
    default:
      return state;
  }
};

export default notesApp;
