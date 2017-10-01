import React from 'react';
import PropTypes from 'prop-types';
import injectSheet from 'react-jss';
import ReactMarkdown from 'react-markdown';
import classNames from 'classnames';
import { HotKeys } from 'react-hotkeys';
import Modal from 'react-modal';
import IconButton from 'material-ui/IconButton';
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import CopyIcon from 'material-ui/svg-icons/content/content-copy';
import MenuIcon from 'material-ui/svg-icons/navigation/menu';
import Theme from 'material-ui/styles/MuiThemeProvider';
import brace from 'brace'; // eslint-disable-line no-unused-vars
import AceEditor from 'react-ace';
import 'brace/mode/markdown';
import 'brace/theme/github';
import PageFlip from './NoteDisplay/PageFlip';
import Settings from './NoteDisplay/Settings';

const styles = {
  notedisplay: {
    position: 'absolute',
    left: '200px',
    right: '0px',
    top: '0px',
    bottom: '0px',
    overflow: 'auto',
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
    outline: '0',
    overflow: 'hidden',
    '& pre': {
      marginLeft: '-10px !important',
      color: '#000',
      padding: '5px',
      backgroundColor: '#f8f8f8',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap',
    },
  },
  actions: {
    position: 'fixed',
    top: '0px',
    right: '0px',
    zIndex: '5',
  },
  actionButtons: {
    float: 'right',
  },
  modalOverlay: {
    zIndex: '10',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
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
      isModalActive: false,
    };

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPageFlip = this.onPageFlip.bind(this);
    this.onMenuClick = this.onMenuClick.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  componentDidMount() {
    this.display.focus();
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
        this.display.focus();
        this.props.onUpdate(this.state.currentNote);
      }
    });
  }

  onMenuClick() {
    this.setState({ isModalActive: true });
  }

  onSave() {
    this.setState({ isModalActive: false });
  }

  render() {
    const { classes, onDeleteNote, onDuplicateNote } = this.props;
    const {
      isPageFlipActive,
      isEditorActive,
      currentNote,
      isActionMenuActive,
      isModalActive,
    } = this.state;

    const keyMap = {
      toggleEditor: ['command+enter', 'esc'],
    };

    const handlers = {
      toggleEditor: () => this.onPageFlip(),
    };

    return (
      <HotKeys keyMap={keyMap} handlers={handlers}>
        <Theme>
          <div
            className={classes.notedisplay}
            onMouseMove={e => this.onMouseMove({ x: e.pageX, y: e.pageY })}
          >
            <div
              tabIndex="-1"
              className={classNames(classes.note, { [classes.hidden]: isEditorActive })}
              ref={(display) => { this.display = display; }}
            >
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
                editorProps={{ $blockScrolling: true }}
              />
              }
            </div>
            <PageFlip
              active={isPageFlipActive}
              onClick={this.onPageFlip}
            />
            <div className={classNames(classes.actions, { [classes.hidden]: !isActionMenuActive })}>
              <IconButton className={classes.actionButtons}>
                <MenuIcon onClick={this.onMenuClick} />
              </IconButton>
              <IconButton className={classes.actionButtons}>
                <DeleteIcon onClick={onDeleteNote} />
              </IconButton>
              <IconButton className={classes.actionButtons}>
                <CopyIcon onClick={onDuplicateNote} />
              </IconButton>
            </div>

            <Modal
              isOpen={isModalActive}
              contentLabel="Settings"
              overlayClassName={{ base: classes.modalOverlay }}
              styles={{ overlay: styles.modalOverlay }}
            >
              <Settings
                onSave={this.onSave}
              />
            </Modal>
          </div>
        </Theme>
      </HotKeys>
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
  onDeleteNote: PropTypes.func.isRequired,
  onDuplicateNote: PropTypes.func.isRequired,
};

export default injectSheet(styles)(NoteDisplay);
