import React from 'react';
import injectSheet from 'react-jss';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const styles = {
  listitem: {
    width: '100%',
    padding: '5px',
    color: '#FFFFFF',
    textAlign: 'left',
    paddingLeft: '25px',
    fontFamily: "'Lato', sans-serif",
    fontWeight: '300',
    boxSizing: 'border-box',
    backgroundColor: '#545454',
    userSelect: 'none',
    outline: 0,
    cursor: 'pointer',
  },
  active: {
    backgroundColor: '#F6D503',
    color: '#333333',
  },
  hidden: {
    display: 'none',
  },
};

const ListItem = ({ classes, children, selected, onClick, hidden }) => (
  <div
    onMouseDown={onClick}
    role="menuitem"
    tabIndex="-1"
    className={classNames(classes.listitem, {
      [classes.active]: selected,
      [classes.hidden]: hidden,
    })}
  >
    {children}
  </div>
);

ListItem.propTypes = {
  classes: PropTypes.shape({
    listitem: PropTypes.string,
  }).isRequired,
  children: PropTypes.node.isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

ListItem.defaultProps = {
  selected: false,
};

export default injectSheet(styles)(ListItem);
