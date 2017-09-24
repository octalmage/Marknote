const updateNote = note => ({
  type: 'UPDATE_NOTE',
  note,
});

const updateCurrentNote = index => ({
  type: 'UPDATE_CURRENT_NOTE',
  index,
});

const deleteCurrentNote = () => ({ type: 'DELETE_CURRENT_NOTE' });
const addNote = () => ({ type: 'NEW_NOTE' });
const duplicateCurrentNote = () => ({ type: 'DUPLICATE_CURRENT_NOTE' });

/* eslint-disable import/prefer-default-export */
export {
  updateNote,
  addNote,
  updateCurrentNote,
  deleteCurrentNote,
  duplicateCurrentNote,
};
/* eslint-enable  import/prefer-default-export */
