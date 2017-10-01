import React from 'react';
import PropTypes from 'prop-types';

class Settings extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isSyncingEnabled: false,
      email: '',
      password: '',
    };

    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  onSave() {
    this.props.onSave();
  }

  handleCheckboxChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value,
    });
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value,
    });
  }

  render() {
    const { isSyncingEnabled, email, password } = this.state;
    return (
      <div>
        <h1>Settings</h1>
        <p>
          <label htmlFor="isSyncingEnabled">
            Syncing:
            <input
              id="isSyncingEnabled"
              name="isSyncingEnabled"
              type="checkbox"
              checked={isSyncingEnabled}
              onChange={this.handleCheckboxChange}
            />
          </label>
        </p>
        <p>
          <input
            type="text"
            id="email"
            name="email"
            placeholder="Email:"
            value={email}
            onChange={this.handleInputChange}
          />
        </p>
        <p>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Password:"
            value={password}
            onChange={this.handleInputChange}
          />
        </p>
        <p>
          <button onClick={this.onSave}>Save</button>
        </p>
      </div>
    );
  }
}

Settings.propTypes = {
  onSave: PropTypes.func.isRequired,
};

export default Settings;
