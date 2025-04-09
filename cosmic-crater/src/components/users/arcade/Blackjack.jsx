import React, { useState, useEffect } from 'react';
import Sponsors from './Sponsors';
import Spinner from '../Spinner';
const SUITS = ['♥', '♦', '♣', '♠'];
const VALUES = ['1','2','3','4','5','6','7','8','9','T','J','Q','K'];
const NUM_PLAYERS = 2;
const valueMap = { '1': 11, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 10, 'Q': 10, 'K': 10 };

function generateDeck(numDecks = 1) {
  const deck = [];
  for (let d = 0; d < numDecks; d++) {
    SUITS.forEach(suit => VALUES.forEach(value => deck.push({ suit, value })));
  }
  return deck;
}

function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function calculateScore(hand) {
  let sum = hand.reduce((acc, c) => acc + valueMap[c.value], 0);
  let aces = hand.filter(c => c.value === '1').length;
  while (sum > 21 && aces > 0) { sum -= 10; aces--; }
  return sum;
}

const Card = ({ card, hidden }) => {
  const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
  return (
    <span style={{ margin: '0 4px', fontSize: '1.5em', color }}>
      {hidden ? '🂠' : `${card.value}${card.suit}`}
    </span>
  );
};

function DeckVerification({ remaining, players, dealer, numDecks }) {
  const dealt = [...players.flatMap(p => p.hand), ...dealer.hand];
  const allCards = [...remaining, ...dealt];

  const suitCounts = SUITS.reduce((acc, suit) => ({
    ...acc,
    [suit]: allCards.filter(c => c.suit === suit).length
  }), {});

  const valueCounts = VALUES.reduce((acc, value) => ({
    ...acc,
    [value]: allCards.filter(c => c.value === value).length
  }), {});

  // Adjusted expected counts per number of decks
  const expectedSuitCount = 13 * numDecks;
  const expectedValueCount = 4 * numDecks;

  const suitsOk = Object.values(suitCounts).every(count => count === expectedSuitCount);
  const valuesOk = Object.values(valueCounts).every(count => count === expectedValueCount);

  return (
    <div style={{ marginTop: 20 }}>
      <p><strong>Verification:</strong> {suitsOk && valuesOk ? '✅ Deck properly dealt' : '❌ Discrepancy found'}</p>
      <div>
        <h4>Suit Counts (Expected per suit: {expectedSuitCount})</h4>
        <ul>
          {SUITS.map(suit => <li key={suit}>{suit}: {suitCounts[suit]}</li>)}
        </ul>
      </div>
      <div>
        <h4>Value Counts (Expected per value: {expectedValueCount})</h4>
        <ul>
          {VALUES.map(value => <li key={value}>{value}: {valueCounts[value]}</li>)}
        </ul>
      </div>
    </div>
  );
}

export default function BlackjackGame() {
  const [numDecks, setNumDecks] = useState(1);
  const [deck, setDeck] = useState([]);
  const [players, setPlayers] = useState([]);
  const [dealer, setDealer] = useState({ hand: [], score: 0 });
  const [gameState, setGameState] = useState('init');
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (gameState === 'init') {
      setDeck(shuffle(generateDeck(numDecks)));
    }
  }, [gameState, numDecks]);

  const startSetup = () => {
    setPlayers(
      Array.from({ length: NUM_PLAYERS }, (_, i) => ({
        name: 'Player ' + (i + 1),
        hand: [],
        bank: 100,
        bet: 0,
        score: 0,
        blackjack: false,
        bust: false
      }))
    );
    setGameState('betting');
  };  

  const handleNameChange = (idx, name) => {
    const ps = [...players];
    ps[idx].name = name;
    setPlayers(ps);
  };

  const handleBetChange = (idx, bet) => {
    const ps = [...players]; ps[idx].bet = Number(bet); setPlayers(ps);
  };

  const startRound = () => {
    for (let p of players) {
      if (p.bet < 1 || p.bet > p.bank) { alert(`Invalid bet for ${p.name}`); return; }
    }
    let d = [...deck];
    const ps = players.map(p => {
      const hand = [d.pop(), d.pop()];
      const score = calculateScore(hand);
      return { ...p, hand, score, blackjack: score === 21, bust: false };
    });
    const dh = [d.pop(), d.pop()];
    const dealerScore = calculateScore(dh);
    setPlayers(ps);
    setDealer({ hand: dh, score: dealerScore });
    setDeck(d);
    setCurrentPlayerIdx(0);
    setGameState('playing');
  };

  const playerHit = idx => {
    let d = [...deck];
    const ps = [...players];
    const card = d.pop();
    const hand = [...ps[idx].hand, card];
    const score = calculateScore(hand);
    ps[idx] = { ...ps[idx], hand, score, bust: score > 21 };
    setPlayers(ps); setDeck(d);
    if (score > 21) nextPlayer();
  };

  const playerStay = () => nextPlayer();
  const nextPlayer = () => {
    if (currentPlayerIdx + 1 < players.length) {
      setCurrentPlayerIdx(currentPlayerIdx + 1);
    } else {
      dealerTurn();
    }
  };

  const dealerTurn = () => {
    let d = [...deck];
    let dh = [...dealer.hand];
    let score = calculateScore(dh);
    while (score < 16) {
      const card = d.pop(); dh.push(card); score = calculateScore(dh);
    }
    setDealer({ hand: dh, score }); setDeck(d);
    setGameState('result'); evaluateOutcome(dh, score);
  };

  const evaluateOutcome = (dh, dScore) => {
    const ps = players.map(p => {
      let result = '', bank = p.bank;
      if (p.score > 21) { result = 'bust'; bank -= p.bet; }
      else if (dScore > 21 || p.score > dScore) { result = 'win'; bank += p.bet; }
      else if (p.score === dScore) { result = 'push'; }
      else { result = 'lose'; bank -= p.bet; }
      return { ...p, bank, result };
    });
    setPlayers(ps);
  };

  const nextRound = () => {
    // 1. Gather all dealt cards from players and dealer
    const dealtCards = [
      ...players.flatMap(p => p.hand),
      ...dealer.hand
    ];
  
    // 2. Combine with the remaining deck and reshuffle
    const refreshedDeck = shuffle([
      ...deck,
      ...dealtCards
    ]);
  
    // 3. Remove busted/ruined players, reset hands/scores/results
    const survivingPlayers = players
      .filter(p => p.bank > 0)
      .map(p => ({
        ...p,
        hand: [],
        score: 0,
        result: null,
        blackjack: false,
        bust: false
      }));
  
    // 4. Reset dealer
    setPlayers(survivingPlayers);
    setDealer({ hand: [], score: 0 });
  
    // 5. Put the new shuffled deck back into state
    setDeck(refreshedDeck);
  
    // 6. Go back to betting
    setGameState('betting');
    setMessage('');
  };
  

  return (
    <div className="row">
        <div className="col-12 col-md-8 text-center" style={{ padding: 20, fontFamily: 'sans-serif' }}>
        <h1>Blackjack Game</h1>
        {gameState === 'init' && (
            <div>
            <label>Decks: <select value={numDecks} onChange={e => setNumDecks(Number(e.target.value))}>{[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}</select></label>
            <button className="btn btn-primary form-control" onClick={startSetup} style={{ marginLeft: 10 }}>Start</button>
            </div>
        )}
        {gameState === 'betting' && (
            <div>
            <h3>Bets</h3>
            {players.map((p,i) => (
                <div key={i}>
                <span>{p.name} (Bank: ${p.bank}): </span>
                <input type="number" value={p.bet} min="1" max={p.bank} onChange={e => handleBetChange(i, e.target.value)} />
                </div>
            ))}
            <button className="btn btn-primary form-control" onClick={startRound} style={{ marginTop: 10 }}>Deal</button>
            </div>
        )}
        {gameState === 'playing' && (
            <div>
            <h3>Dealer</h3>
            <div>{dealer.hand.map((c,i) => <Card key={i} card={c} hidden={i===1} />)} Score: {calculateScore([dealer.hand[0]])}</div>
            <h3>{players[currentPlayerIdx].name}'s Turn</h3>
            <div>Your Hand: {players[currentPlayerIdx].hand.map((c,i) => <Card key={i} card={c} />)} Score: {players[currentPlayerIdx].score}</div>
            <div className="row">
              <div className="col-12 col-md-6">
                <button className="btn btn-primary form-control" onClick={() => playerHit(currentPlayerIdx)} disabled={players[currentPlayerIdx].bust}>
                  Hit
                </button>
              </div>
              <div className="col-12 col-md-6">
                <button className="btn btn-primary form-control" onClick={playerStay} style={{ marginLeft: 10 }}>
                  Stay
                </button>
              </div>
            </div>
            </div>
        )}
        {gameState === 'result' && (
            <div>
            <h3>Dealer</h3>
            <div>{dealer.hand.map((c,i) => <Card key={i} card={c} />)} Score: {dealer.score}</div>
            <h3>Results</h3>
            {players.map((p,i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                <div>{p.name}: {p.result.toUpperCase()} (Bank: ${p.bank})</div>
                <div>Cards: {p.hand.map((c,j) => <Card key={j} card={c} />)}</div>
                </div>
            ))}
            {/* Remaining deck and verification */}
            <div>
                <h3>Remaining Deck</h3>
                <div>{deck.map((c,i) => <Card key={i} card={c} />)}</div>
                <h3>Deck Verification</h3>
                <DeckVerification remaining={deck} players={players} dealer={dealer} numDecks={numDecks} />

            </div>
            <button className="btn btn-primary form-control" onClick={nextRound} style={{ marginTop: 10 }}>Next Round</button>
            </div>
        )}
        </div>
        <div className="col-12 col-md-4">
            <Sponsors />
        </div>
    </div>
  );
}
