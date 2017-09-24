import React from 'react';
import PropTypes from 'prop-types';
import injectSheet from 'react-jss';
import ReactMarkdown from 'react-markdown';
import classNames from 'classnames';
import IconButton from 'material-ui/IconButton';
import ActionDelete from 'material-ui/svg-icons/action/delete';
import Theme from 'material-ui/styles/MuiThemeProvider';
import brace from 'brace'; // eslint-disable-line no-unused-vars
import AceEditor from 'react-ace';
import 'brace/mode/markdown';
import 'brace/theme/github';
import PageFlip from './NoteDisplay/PageFlip';

const styles = {
  notedisplay: {
    position: 'absolute',
    left: '200px',
    right: '0px',
    top: '0px',
    bottom: '0px',
    '& #editor': {
      position: 'absolute',
      left: '0',
      top: '0',
      right: '0',
      bottom: '0',
    },
  },
  hidden: {
    display: 'none',
  },
  note: {
    padding: '0 10px',
  },
  actions: {
    position: 'fixed',
    top: '0px',
    right: '0px',
    zIndex: '5',
  },
};

class NoteDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isPageFlipActive: false,
      isActionMenuActive: false,
      isEditorActive: false,
      currentNote: props.note,
    };

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPageFlip = this.onPageFlip.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ currentNote: nextProps.note }, () => {
      if (this.state.isEditorActive) {
        this.editor.editor.focus();
      }
    });
  }

  onMouseMove({ x, y }) {
    if (x > (window.innerWidth - 75) && y > (window.innerHeight - 75)) {
      this.setState({ isPageFlipActive: true });
    } else {
      this.setState({ isPageFlipActive: false });
    }

    if (x > (window.innerWidth - 200) && y < 50) {
      this.setState({ isActionMenuActive: true });
    } else {
      this.setState({ isActionMenuActive: false });
    }
  }

  onPageFlip() {
    this.setState(state => ({ isEditorActive: !state.isEditorActive }), () => {
      if (this.state.isEditorActive) {
        // Focus the editor on display.
        this.editor.editor.focus();
      } else {
        this.props.onUpdate(this.state.currentNote);
      }
    });
  }

  render() {
    const { classes, onDeleteNote } = this.props;
    const { isPageFlipActive, isEditorActive, currentNote, isActionMenuActive } = this.state;
    return (
      <Theme>
        <div
          className={classes.notedisplay}
          onMouseMove={e => this.onMouseMove({ x: e.pageX, y: e.pageY })}
        >
          <div className={classNames(classes.note, { [classes.hidden]: isEditorActive })}>
            <ReactMarkdown source={currentNote} />
          </div>
          <div>
            { isEditorActive &&
            <AceEditor
              ref={(editor) => { this.editor = editor; }}
              style={{ width: '100%', height: '100%' }}
              mode="markdown"
              theme="github"
              showPrintMargin={false}
              onChange={newContent => this.setState({ currentNote: newContent })}
              name="editor"
              value={currentNote}
            />
            }
          </div>
          <PageFlip
            active={isPageFlipActive}
            onClick={this.onPageFlip}
          />
          <div className={classNames(classes.actions, { [classes.hidden]: !isActionMenuActive })}>
            <IconButton>
              <ActionDelete onClick={onDeleteNote} />
            </IconButton>
          </div>

        </div>
      </Theme>
    );
  }
}

NoteDisplay.propTypes = {
  classes: PropTypes.shape({
    notedisplay: PropTypes.string,
    pageflip: PropTypes.string,
  }).isRequired,
  note: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default injectSheet(styles)(NoteDisplay);
