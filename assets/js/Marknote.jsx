import React from 'react';
import PropTypes from 'prop-types';
import injectSheet from 'react-jss';
import NoteList from './NoteList';
import NoteDisplay from './NoteDisplay';
import connect from './helpers/connect';
import reducers from './reducers';
import {
  updateCurrentNote,
  addNote,
  updateSelectedNote,
  deleteCurrentNote,
  duplicateCurrentNote,
  updateSearchTerm,
} from './actions';

const styles = {
  '@global': {
    body: {
      height: '100%',
      width: '100%',
      margin: '0',
      overflow: 'hidden',
      fontFamily: "'RobotoDraft', sans-serif",
      boxSizing: 'border-box',
    },
    '*': {
      boxSizing: 'border-box',
    },
    wrapper: {
      width: '100%',
    },
  },
};

class Marknote extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      notes: props.notes,
      selected: 0,
      searchTerm: '',
    };

    this.dispatch = connect(() => this.state, this.setState.bind(this), reducers);
    this.updateSelectedNote = selectedIndex => this.dispatch(updateSelectedNote(selectedIndex));
    this.updateSearchTerm = searchTerm => this.dispatch(updateSearchTerm(searchTerm));
  }

  componentWillMount() {
    // Function for importing notes.
    window.MarknoteImportNotes = notes => this.setState({ notes });
  }

  componentWillUpdate(nextProps, nextState) {
    this.props.onUpdate(nextState.notes);
  }

  render() {
    const { notes, selected, searchTerm } = this.state;
    const { classes } = this.props;

    const notesHash = notes.map((note, i) => ({ note, id: i }));

    const hiddenNotes = searchTerm !== ''
      ? notesHash.filter(note => !note.note.toLowerCase()
        .includes(searchTerm.toLowerCase()))
        .map(note => note.id)
      : [];

    return (
      <div className={classes.marknote}>
        <NoteList
          notes={notesHash}
          selected={selected}
          onSelect={this.updateSelectedNote}
          onNewNote={() => this.dispatch(addNote())}
          searchTerm={searchTerm}
          hiddenNotes={hiddenNotes}
          updateSearchTerm={this.updateSearchTerm}
        />
        <NoteDisplay
          note={notes[selected]}
          onUpdate={newContent => this.dispatch(updateCurrentNote(newContent))}
          onDeleteNote={() => this.dispatch(deleteCurrentNote())}
          onDuplicateNote={() => this.dispatch(duplicateCurrentNote())}
        />
      </div>
    );
  }
}

Marknote.propTypes = {
  classes: PropTypes.shape({
    marknote: PropTypes.string,
  }).isRequired,
  notes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default injectSheet(styles)(Marknote);
