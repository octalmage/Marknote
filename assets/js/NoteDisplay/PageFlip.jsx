import React from 'react';
import PropTypes from 'prop-types';
import injectSheet from 'react-jss';
import classNames from 'classnames';

const styles = {
  pageflip: {
    position: 'fixed',
    bottom: '0px',
    right: '0px',
    width: '0px',
    height: '0px',
    zIndex: '10',
    background: 'linear-gradient(-45deg, #FFF, #FFF 44%, #ACACAC 45%)',
    transition: 'all .5s ease',
    outline: 0,
    cursor: 'pointer',
  },
  active: {
    width: '25px',
    height: '25px',
  },
};

const PageFlip = ({ active, classes, onClick }) => (
  <div
    className={classNames(classes.pageflip, { [classes.active]: active })}
    onClick={onClick}
    role="button"
    tabIndex="-1"
  />
);

PageFlip.propTypes = {
  classes: PropTypes.shape({
    pageflip: PropTypes.string,
  }).isRequired,
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default injectSheet(styles)(PageFlip);
