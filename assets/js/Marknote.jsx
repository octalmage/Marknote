import React from 'react';
import PropTypes from 'prop-types';
import injectSheet from 'react-jss';
import NoteList from './NoteList';
import NoteDisplay from './NoteDisplay';

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
    wrapper: {
      width: '100%',
    },
  },
};

class Marknote extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      notes: props.notes,
      selected: 0,
    };

    this.updateNote = this.updateNote.bind(this);
  }

  updateNote(newContent) {
    const newNotes = this.state.notes.slice();
    newNotes[this.state.selected] = newContent;
    newNotes.splice(0, 0, newNotes.splice(this.state.selected, 1)[0]);
    this.setState({ notes: newNotes, selected: 0 });
    this.props.onUpdate(newNotes);
  }

  render() {
    const { notes, selected } = this.state;
    const { classes } = this.props;
    return (
      <div className={classes.marknote}>
        <NoteList
          notes={notes}
          selected={selected}
          onSelect={selectedIndex => this.setState({ selected: selectedIndex })}
        />
        <NoteDisplay
          note={notes[selected]}
          onUpdate={this.updateNote}
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
