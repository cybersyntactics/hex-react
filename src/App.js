import React, { Component } from 'react';
import Game from './Game';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <h1 id="App-header">
          <a href="https://wikipedia.org/wiki/Hex_(board_game)">HEX</a>
        </h1>
        <Game 
          width={document.documentElement.clientWidth /*943*/}
          height={document.documentElement.clientHeight /*622*/}
          id="playArea"
          className="playArea"
        />
      </div>
    );
  }
}

export default App;
