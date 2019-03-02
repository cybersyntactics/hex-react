import React, { Component } from 'react';
import Game from './Game';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <h1 id="App-header">
          <a href="https://wikipedia.org/wiki/Hex_(board_game)">Hex</a>
        </h1>
        <Game />
      </div>
    );
  }
}

export default App;
