import React from 'react';
import injectSheet from 'react-jss';
import PropTypes from 'prop-types';
import Theme from 'material-ui/styles/MuiThemeProvider';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import { HotKeys } from 'react-hotkeys';
import ListItem from './NoteList/ListItem';
import { COLORS } from './helpers/constants';

const styles = {
  note: {
    backgroundColor: COLORS.background,
    width: '200px',
    height: '100%',
    position: 'absolute',
    overflow: 'auto',
  },
  floatingButton: {
    position: 'fixed',
    bottom: '25px',
    left: '135px',
    zIndex: '5',
  },
  search: {
    backgroundColor: COLORS.background,
    color: 'white',
    outline: '0',
    border: 'none',
    position: 'fixed',
    width: '200px',
    height: '20px',
    textAlign: 'center',
    '&::placeholder': {
      color: '#c0c0c0',
      textAlign: 'center',
    },
  },
  list: {
    marginTop: '20px',
  },
};

const getTitle = note => note.split('\n')[0] // Grab the first line.
  .replace(/\(.*\)/g, '') // Remove links.
  .replace(/\W+/g, ' '); // Remove all non letters.

const NoteList = ({
  classes,
  notes,
  selected,
  onSelect,
  onNewNote,
  searchTerm,
  updateSearchTerm,
  hiddenNotes,
}) => {
  const keyMap = {
    submitSearch: ['enter'],
    cancelSearch: ['esc'],
  };

  const handlers = {
    submitSearch: () => {
      if (searchTerm !== '') {
        const matchedResults = notes
          .map(note => note.id)
          .filter(id => !hiddenNotes.includes(id));
        if (matchedResults.length !== 0) {
          onSelect(matchedResults[0]);
        } else {
          updateSearchTerm('');
        }
      } else {
        updateSearchTerm('');
      }
    },
    cancelSearch: () => updateSearchTerm(''),
  };

  return (
    <Theme>
      <div className={classes.note}>
        <HotKeys keyMap={keyMap} handlers={handlers}>
          <input
            className={classes.search}
            type="text"
            placeholder="Search"
            onChange={e => updateSearchTerm(e.target.value)}
            value={searchTerm}
          />
        </HotKeys>
        <div className={classes.list}>
          {notes.map((note, i) => (
            <ListItem
              selected={i === selected}
              key={note.id}
              onClick={() => onSelect(i)}
              hidden={hiddenNotes.includes(note.id)}
            >
              {getTitle(note.note)}
            </ListItem>),
          )}
        </div>
        <FloatingActionButton onClick={onNewNote} className={classes.floatingButton} mini secondary>
          <ContentAdd />
        </FloatingActionButton>
      </div>
    </Theme>
  );
};

NoteList.propTypes = {
  classes: PropTypes.shape({
    note: PropTypes.string,
  }).isRequired,
  notes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      note: PropTypes.string,
    }),
  ).isRequired,
  selected: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  onNewNote: PropTypes.func.isRequired,
  updateSearchTerm: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  hiddenNotes: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default injectSheet(styles)(NoteList);
