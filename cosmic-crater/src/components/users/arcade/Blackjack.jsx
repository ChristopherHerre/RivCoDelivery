import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Sponsors from './Sponsors';

const SUITS = ['S', 'D', 'C', 'H'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];

// Functions to determine a card's suit, rank, and value based on its number (0–51)
function getSuit(cNumber) {
  if (cNumber < 13) return 'S';
  else if (cNumber < 26) return 'D';
  else if (cNumber < 39) return 'C';
  else return 'H';
}

function getRank(cNumber) {
  return RANKS[cNumber % 13];
}

function getVal(cNumber) {
  const rank = getRank(cNumber);
  if (rank === 'A') return 1;
  if (['T', 'J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank);
}

function cardToString(cNumber) {
  return `${getRank(cNumber)}${getSuit(cNumber)}`;
}

// Component to display a card using Bootstrap 5 icons
function CardIcon({ cNumber }) {
  const suit = getSuit(cNumber);
  const rank = getRank(cNumber);
  let iconClass = '';
  switch (suit) {
    case 'S':
      iconClass = 'bi bi-suit-spade-fill';
      break;
    case 'H':
      iconClass = 'bi bi-suit-heart-fill';
      break;
    case 'D':
      iconClass = 'bi bi-suit-diamond-fill';
      break;
    case 'C':
      iconClass = 'bi bi-suit-club-fill';
      break;
    default:
      break;
  }
  return (
    <div className="card text-center m-1" style={{ width: '4rem' }}>
      <div className="card-body p-1">
        <div>{rank}</div>
        <i className={iconClass} style={{ fontSize: '1.5rem' }}></i>
      </div>
    </div>
  );
}

// Initialize a deck of 52 cards as an array of numbers (0–51)
function initDeck() {
  const deck = [];
  for (let i = 0; i < 52; i++) {
    deck.push(i);
  }
  return deck;
}

// Shuffle the deck (performing 3 passes over the deck, similar to your C++ logic)
function shuffleDeck(deck) {
  let newDeck = [...deck];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < newDeck.length; j++) {
      const ran = Math.floor(Math.random() * newDeck.length);
      [newDeck[j], newDeck[ran]] = [newDeck[ran], newDeck[j]];
    }
  }
  return newDeck;
}

function BlackjackGame() {
  // State for number of players (dealer is the last player), players, deck, and game status
  const [numPlayers, setNumPlayers] = useState(2); // default: one player + dealer
  const [players, setPlayers] = useState([]);
  const [deck, setDeck] = useState(shuffleDeck(initDeck()));
  const [dealt, setDealt] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState('');

  // Create an initial players array. Each player has two cards (card1 and card2), an array for hits, a score, a bet, and a bank.
  const initPlayers = (pCount) => {
    const newPlayers = [];
    for (let i = 0; i < pCount; i++) {
      newPlayers.push({
        card1: null,
        card2: null,
        hits: [],
        score: 0,
        bet: i === pCount - 1 ? 0 : 0, // Dealer has no bet
        bank: i === pCount - 1 ? 0 : 2500,
      });
    }
    return newPlayers;
  };

  // Start the game: initialize players, assign a fixed bet (for demo), and deal two cards to each player.
  const startGame = () => {
    if (numPlayers > 5) {
      setMessage("Maximum allowed players is 5.");
      return;
    }
    const newPlayers = initPlayers(numPlayers);
    // For demonstration, assign a fixed bet (e.g. $100) for non-dealer players.
    newPlayers.forEach((player, index) => {
      if (index !== numPlayers - 1) {
        player.bet = 100;
        player.bank -= 100;
      }
    });
    // Deal two cards per player ensuring no duplicates.
    let currentDeck = [...deck];
    let currentDealt = [];
    newPlayers.forEach((player, index) => {
      const card1Index = drawCardIndex(currentDeck, currentDealt);
      const card2Index = drawCardIndex(currentDeck, currentDealt);
      player.card1 = currentDeck[card1Index];
      player.card2 = currentDeck[card2Index];
      player.score = getVal(player.card1) + getVal(player.card2);
      currentDealt.push(card1Index, card2Index);
    });
    setPlayers(newPlayers);
    setDealt(currentDealt);
    setGameStarted(true);
  };

  // Draw a card index from the deck that hasn’t been dealt yet.
  const drawCardIndex = (deck, dealtList) => {
    let index = Math.floor(Math.random() * deck.length);
    while (dealtList.includes(index)) {
      index = Math.floor(Math.random() * deck.length);
    }
    return index;
  };

  // The "hit" action: draw one card for the given player.
  const hit = (playerIndex) => {
    let newPlayers = [...players];
    const cardIndex = drawCardIndex(deck, dealt);
    newPlayers[playerIndex].hits.push(deck[cardIndex]);
    newPlayers[playerIndex].score += getVal(deck[cardIndex]);
    setPlayers(newPlayers);
    setDealt([...dealt, cardIndex]);
  };

  return (
    <div className="row">
      <div className="col-12 col-md-8">
        <div className="p-1 mt-4">
          <h1>Blackjack Game</h1>
          {!gameStarted && (
            <div>
              <div className="mb-3">
                <label>Number of players (max 5, dealer is last): </label>
                <input
                  type="number"
                  value={numPlayers}
                  min="1"
                  max="5"
                  onChange={(e) => setNumPlayers(parseInt(e.target.value))}
                  className="bg-dark text-white form-control"
                  style={{ width: "100px" }}
                />
              </div>
              <button className="btn btn-primary" onClick={startGame}>
                Start Game
              </button>
              {message && <div className="mt-2 text-danger">{message}</div>}
            </div>
          )}
          {gameStarted && (
            <div>
              <h2>Players</h2>
              {players.map((player, idx) => (
                <div key={idx} className="mb-3 border p-2">
                  <h4>{idx === players.length - 1 ? "Dealer" : `Player ${idx + 1}`}</h4>
                  <div className="d-flex">
                    {player.card1 !== null && <CardIcon cNumber={player.card1} />}
                    {player.card2 !== null && <CardIcon cNumber={player.card2} />}
                    {player.hits.map((hitCard, hIdx) => (
                      <CardIcon key={hIdx} cNumber={hitCard} />
                    ))}
                  </div>
                  <p>Score: {player.score}</p>
                  {idx !== players.length - 1 && player.score < 21 && (
                    <button className="btn btn-success btn-sm" onClick={() => hit(idx)}>
                      Hit
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="col-12 col-md-4">
        <Sponsors />
      </div>
    </div>
  );
}

export default BlackjackGame;
