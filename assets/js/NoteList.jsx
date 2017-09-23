import React from 'react';
import injectSheet from 'react-jss';
import PropTypes from 'prop-types';
import ListItem from './NoteList/ListItem';

const styles = {
  note: {
    backgroundColor: '#545454',
    width: '200px',
    height: '100%',
    position: 'absolute',
    paddingTop: '10px',
  },
};

const getTitle = note => note.split('\n')[0] // Grab the first line.
  .replace(/\(.*\)/g, '') // Remove links.
  .replace(/\W+/g, ' '); // Remove all non letters.

const NoteList = ({ classes, notes, selected, onSelect }) => (
  <div className={classes.note}>
    {notes.map((note, i) => (
      <ListItem
        selected={i === selected}
        key={getTitle(note)}
        onClick={() => onSelect(i)}
      >
        {getTitle(note)}
      </ListItem>),
    )}
  </div>
);

NoteList.propTypes = {
  classes: PropTypes.shape({
    note: PropTypes.string,
  }).isRequired,
  notes: PropTypes.arrayOf(PropTypes.string).isRequired,
  selected: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default injectSheet(styles)(NoteList);
