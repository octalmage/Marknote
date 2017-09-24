import React from 'react';
import injectSheet from 'react-jss';
import PropTypes from 'prop-types';
import Theme from 'material-ui/styles/MuiThemeProvider';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import ListItem from './NoteList/ListItem';

const styles = {
  note: {
    backgroundColor: '#545454',
    width: '200px',
    height: '100%',
    position: 'absolute',
    paddingTop: '10px',
  },
  floatingButton: {
    position: 'fixed',
    bottom: '25px',
    left: '135px',
    zIndex: '5',
  },
};

const getTitle = note => note.split('\n')[0] // Grab the first line.
  .replace(/\(.*\)/g, '') // Remove links.
  .replace(/\W+/g, ' '); // Remove all non letters.

const NoteList = ({ classes, notes, selected, onSelect, onNewNote }) => (
  <Theme>
    <div className={classes.note}>
      {notes.map((note, i) => (
        <ListItem
          selected={i === selected}
          key={i} // eslint-disable-line react/no-array-index-key
          onClick={() => onSelect(i)}
        >
          {getTitle(note)}
        </ListItem>),
      )}
      <FloatingActionButton onClick={onNewNote} className={classes.floatingButton} mini secondary>
        <ContentAdd />
      </FloatingActionButton>
    </div>
  </Theme>
);

NoteList.propTypes = {
  classes: PropTypes.shape({
    note: PropTypes.string,
  }).isRequired,
  notes: PropTypes.arrayOf(PropTypes.string).isRequired,
  selected: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  onNewNote: PropTypes.func.isRequired,
};

export default injectSheet(styles)(NoteList);
