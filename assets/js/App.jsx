import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Store from 'electron-store';

const store = new Store();
const defaultnote = ['# Welcome to Marknote!\n**This is markdown.** Click the bottom right corner to get started.'];
let notes = store.get('notes', defaultnote).filter(n => n);

if (!Array.isArray(notes)) {
  notes = defaultnote;
}

const render = () => {
  // NB: We have to re-require MyApp every time or else this won't work
  // We also need to wrap our app in the AppContainer class
  const Marknote = require('./Marknote').default; // eslint-disable-line global-require
  ReactDOM.render(
    <AppContainer>
      <Marknote
        notes={notes}
        onUpdate={newNotes => store.set('notes', newNotes)}
      />
    </AppContainer>, document.getElementById('app'));
};

render();
if (module.hot) { module.hot.accept(render); }
