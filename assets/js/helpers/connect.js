/**
 * Helper to make dispatching actions easier.
 * @param  {function} getState Function to retrieve current state.
 * @param  {function} setState Function to set the state.
 * @param  {object}   actions  An object containing the actions.
 * @return {function}          A function to dispatch actions.
 */
const connect = (getState, setState, reducers) => {
  /**
   * Call an action and handle the result.
   * @param  {string} name   The name of the action.
   * @param  {object} action The parameters for the action.
   * @return {Promise}       The result of the action in Promise form.
   */
  const dispatch = (action) => {
    // Support async actions.
    if (typeof action === 'function') {
      return action(dispatch, getState);
    }

    // Call the reducer and either get the new state, or a function.
    const next = reducers(getState(), action);

    // Set the state and resolve once the state has been set.
    return new Promise(resolve => setState(() => next, resolve));
  };

  return dispatch;
};

export default connect;
